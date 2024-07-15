use aiken/transaction.{OutputReference, ScriptContext}
use aiken_mdx_test/validation.{MintActions, State, ValidateActions}

// Foo comment
validator(_init_ref: OutputReference) {
  fn minter(_rdmr: MintActions, _ctx: ScriptContext) -> Bool {
    fail
  }

  fn validate(
    _datum: State,
    _rdmr: ValidateActions,
    _ctx: ScriptContext,
  ) -> Bool {
    fail
  }
}
