interface Props {
    contractAddress: string;
    ownerAddress: string;
    fee: string;
    userAddress: string;
    isOwnerLabel: any;
    chainCorrectLabel: any;
}

const InfoPanel = (props: Props) => {
    return (
        <div>
            <p>Contract address: {props.contractAddress}</p>
            <p>Owner address: {props.ownerAddress}</p>
            <p>Connected wallet: {props.userAddress}</p>
            <p>Fee: {props.fee}</p>
            {props.isOwnerLabel}
            {props.chainCorrectLabel}
        </div>
    );
};

export default InfoPanel;
