use aiken/builtin
use aiken/transaction.{Datum, InlineDatum}

pub fn get_inline_datum(datum: Datum) -> Data {
  expect InlineDatum(datum) = datum
  datum
}

pub fn skip_to(xs: List<a>, index: Int) -> List<a> {
  if index == 0 {
    xs
  } else {
    skip_to(builtin.tail_list(xs), index - 1)
  }
}

pub fn list_at(xs: List<a>, index: Int) -> a {
  if index == 0 {
    builtin.head_list(xs)
  } else {
    list_at(builtin.tail_list(xs), index - 1)
  }
}
