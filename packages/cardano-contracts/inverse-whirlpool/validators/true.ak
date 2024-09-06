// This always-true validator allows us to mint tokens with arbitrary names
// this allows using these token names as extra data input into the main whirlpool validator
validator always {
  mint(_action, _policy, _tx) {
    // Always true
    True
  }

  else(_) {
    fail
  }
}
