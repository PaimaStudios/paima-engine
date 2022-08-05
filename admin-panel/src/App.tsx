import { useEffect, useState } from "react";
import "./App.css";
import useInterval from "./hooks/useInterval";

import ControlPanel from "./ControlPanel";
import InfoPanel from "./InfoPanel";

import { getFee, getOwner, getWeb3 } from "paima-utils";
import Web3 from "web3";
import {
    CHAIN_URI,
    CONTRACT_ADDRESS,
    promiseSetFee,
    promiseSetOwner,
    promiseWithdrawFunds,
    userWalletLogin,
    verifyWalletChain,
} from "./ethereum";

const QUERY_PERIOD = 4000;

function App() {
    const [web3, setWeb3] = useState<Web3 | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [wallet, setWallet] = useState<string>("");
    const [correctChain, setCorrectChain] = useState<boolean>(false);

    const [fee, setFee] = useState<string>("");
    const [owner, setOwner] = useState<string>("");
    const [balance, setBalance] = useState<string>("");
    const [inputString, setInputString] = useState<string>("");

    const walletConnected = /^0x[0-9a-fA-F]+$/.test(wallet);
    const walletDescriptor = walletConnected ? wallet : "WALLET NOT CONNECTED";
    const web3Uninitialized = isLoading || typeof web3 === "undefined";
    const connectedIsOwner = wallet.toLowerCase() === owner.toLowerCase();

    const userIsNotOwnerLabel = (
        <p>
            <span>CONNECTED USER IS NOT THE OWNER!</span>
        </p>
    );
    const userIsOwnerLabel = (
        <p>
            <span>Connected user is the owner.</span>
        </p>
    );

    const chainIsCorrectLabel = (
        <p>
            <span>You are connected to the correct chain.</span>
        </p>
    );
    const chainIsIncorrectLabel = (
        <p>
            <span>YOU ARE CONNECTED TO THE WRONG CHAIN!</span>
        </p>
    );

    const isOwnerLabel = walletConnected
        ? connectedIsOwner
            ? userIsOwnerLabel
            : userIsNotOwnerLabel
        : null;
    const chainCorrectLabel = walletConnected
        ? correctChain
            ? chainIsCorrectLabel
            : chainIsIncorrectLabel
        : null;

    const updateValues = async (web3: Web3) => {
        const [fee, owner, balance] = await Promise.all([
            getFee(CONTRACT_ADDRESS, web3),
            getOwner(CONTRACT_ADDRESS, web3),
            web3.eth.getBalance(CONTRACT_ADDRESS)
        ]);

        setFee(fee);
        setOwner(owner);
        setBalance(balance);
    };

    const autoUpdateValues = async () =>
        web3Uninitialized ? null : updateValues(web3);

    useEffect(() => {
        const init = async () => {
            try {
                const web3 = await getWeb3(CHAIN_URI);
                setWeb3(web3);
                await updateValues(web3);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        setIsLoading(true);
        init();
    }, []);

    useInterval(autoUpdateValues, web3Uninitialized ? null : QUERY_PERIOD);

    const connectWalletFxn = () => {
        userWalletLogin().then(userWallet => {
            verifyWalletChain().then(chainValidity =>
                setCorrectChain(chainValidity)
            );
            setWallet(userWallet);
        });
    };

    const withdrawFundsFxn = () => {
        if (web3Uninitialized) {
            return;
        }
        console.log("Withdrawing...");
        promiseWithdrawFunds(web3, wallet)
            .then(console.log)
            .catch(console.error);
    };

    const setFeeFxn = () => {
        if (web3Uninitialized) {
            return;
        }

        console.log("Setting fee", inputString);
        if (/^\d+$/.test(inputString)) {
            promiseSetFee(web3, wallet, inputString)
                .then(console.log)
                .catch(console.error);
        } else {
            console.log("Input string is not a valid fee.");
        }
    };

    const setOwnerFxn = () => {
        if (web3Uninitialized) {
            return;
        }
        console.log("Setting owner", inputString);
        if (/^0x[0-9a-fA-F]+$/.test(inputString)) {
            promiseSetOwner(web3, wallet, inputString)
                .then(console.log)
                .catch(console.error);
        } else {
            console.log("Input string is not a valid address.");
        }
    };

    if (isLoading) {
        return (
            <div className="App">
                <header className="App-header">
                    <p>Loading...</p>
                </header>
            </div>
        );
    } else {
        return (
            <div className="App">
                <header className="App-header">
                    <p>Paima Contract Admin Panel</p>
                </header>
                <div className="App-body">
                    <InfoPanel
                        contractAddress={CONTRACT_ADDRESS}
                        ownerAddress={owner}
                        userAddress={walletDescriptor}
                        fee={fee}
                        contractBalance={balance}
                        isOwnerLabel={isOwnerLabel}
                        chainCorrectLabel={chainCorrectLabel}
                    />
                    <ControlPanel
                        userAddress={wallet}
                        inputString={inputString}
                        setInputString={setInputString}
                        connectWalletFxn={connectWalletFxn}
                        withdrawFundsFxn={withdrawFundsFxn}
                        setFeeFxn={setFeeFxn}
                        setOwnerFxn={setOwnerFxn}
                    />
                </div>
            </div>
        );
    }
}

export default App;
