// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

contract CTest {
    event log(string);
    event logs(bytes);

    event log_address(address);
    event log_bytes32(bytes32);
    event log_int(int256);
    event log_uint(uint256);
    event log_bytes(bytes);
    event log_string(string);

    event log_named_address(string key, address val);
    event log_named_bytes32(string key, bytes32 val);
    event log_named_decimal_int(string key, int256 val, uint256 decimals);
    event log_named_decimal_uint(string key, uint256 val, uint256 decimals);
    event log_named_int(string key, int256 val);
    event log_named_uint(string key, uint256 val);
    event log_named_bytes(string key, bytes val);
    event log_named_string(string key, string val);

    bool public failed;
    address constant HEVM_ADDRESS =
        address(bytes20(uint160(uint256(keccak256("hevm cheat code")))));

    function fail() internal {
        failed = true;
    }

    // modifier logs_gas() {
    //     uint startGas = gasleft();
    //     _;
    //     uint endGas = gasleft();
    //     emit log_named_uint("gas", startGas - endGas);
    // }

    function assertTrue(bool condition) internal returns (bool) {
        if (!condition) {
            emit log("Error: Assertion Failed");
            fail();
        }
        return condition;
    }

    function assertTrue(bool condition, string memory err)
        internal
        returns (bool)
    {
        if (bytes(err).length == 0) return assertTrue(condition);
        if (!condition) {
            emit log_named_string("Error:", err);
            fail();
        }
        return condition;
    }

    function assertEq(address a, address b) internal {
        assertEq(a, b, "");
    }

    function assertEq(
        address a,
        address b,
        string memory err
    ) internal {
        if (!assertTrue(a == b, err)) {
            emit log("Reason: a == b not satisfied [address]");
            emit log_named_address("  Expected", b);
            emit log_named_address("    Actual", a);
        }
    }

    function assertEq(bytes32 a, bytes32 b) internal {
        assertEq(a, b, "");
    }

    function assertEq(
        bytes32 a,
        bytes32 b,
        string memory err
    ) internal {
        if (!assertTrue(a == b, err)) {
            emit log("Reason: a == b not satisfied [bytes32]");
            emit log_named_bytes32("  Expected", b);
            emit log_named_bytes32("    Actual", a);
        }
    }

    function assertEq(int256 a, int256 b) internal {
        assertEq(a, b, "");
    }

    function assertEq(
        int256 a,
        int256 b,
        string memory err
    ) internal {
        if (!assertTrue(a == b, err)) {
            emit log("Reason: a == b not satisfied [int]");
            emit log_named_int("  Expected", b);
            emit log_named_int("    Actual", a);
        }
    }

    function assertEq(uint256 a, uint256 b) internal {
        assertEq(a, b, "");
    }

    function assertEq(
        uint256 a,
        uint256 b,
        string memory err
    ) internal {
        if (!assertTrue(a == b, err)) {
            emit log("Reason: a == b not satisfied [uint]");
            emit log_named_uint("  Expected", b);
            emit log_named_uint("    Actual", a);
        }
    }

    function assertEq(string memory a, string memory b) internal {
        assertEq(a, b, "");
    }

    function assertEq(
        string memory a,
        string memory b,
        string memory err
    ) internal {
        if (
            !assertTrue(
                keccak256(abi.encodePacked(a)) ==
                    keccak256(abi.encodePacked(b)),
                err
            )
        ) {
            emit log("Reason: a == b not satisfied [string]");
            emit log_named_string("  Expected", b);
            emit log_named_string("    Actual", a);
        }
    }

    function checkEq0(bytes memory a, bytes memory b)
        internal
        pure
        returns (bool)
    {
        if (a.length != b.length) return false;
        for (uint256 i = 0; i < a.length; i++) if (a[i] != b[i]) return false;
        return true;
    }

    function assertEq0(bytes memory a, bytes memory b) internal {
        assertEq0(a, b, "");
    }

    function assertEq0(
        bytes memory a,
        bytes memory b,
        string memory err
    ) internal {
        if (!assertTrue(checkEq0(a, b), err)) {
            emit log("Reason: a == b not satisfied [bytes]");
            emit log_named_bytes("  Expected", b);
            emit log_named_bytes("    Actual", a);
        }
    }
}
