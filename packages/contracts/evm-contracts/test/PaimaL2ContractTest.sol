// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import "../contracts/PaimaL2Contract.sol";

contract PaimaL2ContractTest is Test {
    event PaimaGameInteraction(address indexed userAddress, bytes data, uint256 value);

    PaimaL2Contract strg;

    address account1 = 0x766FCe3d50d795Fe6DcB1020AB58bccddd5C5c77;
    address account2 = 0x078D888E40faAe0f32594342c85940AF3949E666;

    uint256 constant MAX_INT = 2 ** 256 - 1;
    uint256 constant FEE = 1e16;

    function setUp() public {
        strg = new PaimaL2Contract(address(account1), FEE);
        vm.deal(account1, 100 ether);
        vm.deal(account2, 100 ether);
    }

    function testWithdraw() public {
        vm.prank(account1);
        strg.withdrawFunds();
        assertEq(address(strg).balance, 0);
    }

    function testCannotWithdraw() public {
        vm.prank(account2);
        vm.expectRevert("Only owner can withdraw funds");
        strg.withdrawFunds();
    }

    function testCannotStoreWithoutFee() public {
        vm.startPrank(account2);
        vm.expectRevert("Sufficient funds required to submit game input");
        strg.paimaSubmitGameInput("0x123456");
        vm.expectRevert("Sufficient funds required to submit game input");
        strg.paimaSubmitGameInput{value: FEE - 1}("0x123456");
        vm.stopPrank();
    }

    function testStore() public {
        vm.prank(account2);
        bytes memory data = "0x123456";
        vm.expectEmit(true, true, true, true);
        emit PaimaGameInteraction(account2, data, FEE);
        strg.paimaSubmitGameInput{value: FEE}(data);
        assertEq(address(strg).balance, FEE);
    }

    function testStoreAndWithdraw() public {
        vm.startPrank(account2);
        bytes memory data = "0x123456";
        strg.paimaSubmitGameInput{value: FEE}(data);
        strg.paimaSubmitGameInput{value: FEE}(data);
        strg.paimaSubmitGameInput{value: FEE}(data);
        vm.stopPrank();
        assertEq(address(strg).balance, FEE * 3);
        vm.prank(account1);
        strg.withdrawFunds();
        assertEq(address(strg).balance, 0);
    }

    function testChangeOwner() public {
        assertEq(strg.owner(), account1);
        vm.prank(account1);
        strg.setOwner(account2);
        assertEq(strg.owner(), account2);
        vm.prank(account2);
        strg.withdrawFunds();
    }

    function testCannotChangeOwner() public {
        assertEq(strg.owner(), account1);
        vm.prank(account2);
        vm.expectRevert("Only owner can change owner");
        strg.setOwner(account1);
        assertEq(strg.owner(), account1);
    }

    function testChangeFee() public {
        uint256 newFee = FEE * 2;
        assertEq(strg.owner(), account1);
        assertEq(strg.fee(), FEE);
        vm.prank(account1);
        strg.setFee(newFee);
        assertEq(strg.fee(), newFee);

        bytes memory data = "0x123456";
        vm.prank(account2);
        vm.expectRevert("Sufficient funds required to submit game input");
        strg.paimaSubmitGameInput{value: newFee - 1}(data);

        vm.prank(account2);
        vm.expectEmit(true, true, true, true);
        emit PaimaGameInteraction(account2, data, newFee);
        strg.paimaSubmitGameInput{value: newFee}(data);
        assertEq(address(strg).balance, newFee);
    }

    function testCannotChangeFee() public {
        assertEq(strg.fee(), FEE);
        vm.prank(account2);
        vm.expectRevert("Only owner can change fee");
        strg.setFee(FEE * 2);
        assertEq(strg.fee(), FEE);
    }
}
