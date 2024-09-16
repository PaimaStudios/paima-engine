type ColumnDataTuple = [
  column_name: string,
  data_type: string,
  nullable: 'NO' | 'YES',
  default_value: string,
];

export interface ColumnData {
  columnName: string;
  columnType: string;
  columnNullable: string;
  defaultValue: string;
}

type TableIndex = { name: string; creationQuery: string };
export interface TableData {
  tableName: string;
  primaryKeyColumns: string[];
  columnData: ColumnData[];
  serialColumns: string[];
  creationQuery: string;
  index?: TableIndex | TableIndex[];
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
