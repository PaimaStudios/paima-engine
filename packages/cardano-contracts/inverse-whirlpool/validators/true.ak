// This always-true validator allows us to mint tokens with arbitrary names
// this allows using these token names as extra data input into the main whirlpool validator
validator {
  fn mint(_action, _context) -> Bool {
    // Always true
    True
  }
}
