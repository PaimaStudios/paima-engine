interface Props {
  userAddress: string;
  inputString: string;
  setInputString: (s: string) => void;
  withdrawFundsFxn: () => void;
  connectWalletFxn: () => void;
  setFeeFxn: () => void;
  setOwnerFxn: () => void;
}

const ControlPanel = (props: Props) => {
  return (
    <div>
      <p>
        Input:
        <input
          type="text"
          value={props.inputString}
          onInput={e => props.setInputString(e.currentTarget.value)}
        />
      </p>
      <div>
        <button onClick={props.connectWalletFxn}>Connect wallet</button>
        <button onClick={props.withdrawFundsFxn}>Withdraw funds</button>
        <button onClick={props.setFeeFxn}>Set fee</button>
        <button onClick={props.setOwnerFxn}>Set owner</button>
      </div>
    </div>
  );
};

export default ControlPanel;
