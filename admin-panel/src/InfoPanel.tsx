interface Props {
    contractAddress: string;
    ownerAddress: string;
    fee: string;
    contractBalance: string;
    userAddress: string;
    isOwnerLabel: any;
    chainCorrectLabel: any;
}

const DECIMALS = 18;

const InfoPanel = (props: Props) => {
    const scaledFee = decimalScaling(props.fee, DECIMALS);
    const scaledBalance = decimalScaling(props.contractBalance, DECIMALS);
    return (
        <div>
            <p>Contract address: {props.contractAddress}</p>
            <p>Owner address: {props.ownerAddress}</p>
            <p>Connected wallet: {props.userAddress}</p>
            <p>Fee: {props.fee} (= {scaledFee} at {DECIMALS} decimals)</p>
            <p>Contract balance: {props.contractBalance} (= {scaledBalance} at {DECIMALS} decimals)</p>
            {props.isOwnerLabel}
            {props.chainCorrectLabel}
        </div>
    );
};



function decimalScaling(unscaledString: string, decimals: number, show: number = 3) {
    if (decimals <= 0) {
        return unscaledString + "0".repeat(-decimals);
    }
    let prefix: string;
    let suffix: string;
    if (unscaledString.length <= decimals) {
        prefix = "0";
        suffix = "0".repeat(decimals - unscaledString.length) + unscaledString;
    } else {
        prefix = unscaledString.slice(0, -decimals);
        suffix = unscaledString.slice(-decimals);
    }
    suffix = suffix.slice(0, show);
    return prefix + "." + suffix;
}

export default InfoPanel;
