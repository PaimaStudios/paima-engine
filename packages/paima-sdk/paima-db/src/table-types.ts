type ColumnDataTuple = [
  column_name: string,
  data_type: string,
  nullable: string,
  default_value: string,
];

export interface ColumnData {
  columnName: string;
  columnType: string;
  columnNullable: string;
  defaultValue: string;
}

export interface TableData {
  tableName: string;
  primaryKeyColumns: string[];
  columnData: ColumnData[];
  serialColumns: string[];
  creationQuery: string;
}

function packTuple(tuple: ColumnDataTuple): ColumnData {
  const [columnName, columnType, columnNullable, defaultValue] = tuple;
  return {
    columnName,
    columnType,
    columnNullable,
    defaultValue,
  };
}

export function packTuples(tuples: ColumnDataTuple[]): ColumnData[] {
  return tuples.map(packTuple);
}
