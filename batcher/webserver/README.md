# Paima Batcher Webserver

The webserver including HTTP endpoints.

## Usage

Currently the library is in development, unpublished, and to be
imported and used locally.

## Endpoints

The webserver currently supports three endpoints:

### Submit User Input

```http
POST /submit_user_input
```

See example for expected format of body parameter. The details of the individual fields (especially user_signature) are specific to each individual supported chain (only EVM and Cardano as of 2023-02-15).

The response will be a JSON object containing a `boolean` field, `success`, determining whether the input was accepted or not.

- If `success` is `false`, a `string` field, `message`, will be present describing the reason for refusal.
- If `success` is `true`, a `string` field, `hash`, will be present containing a hash of the submitted input that can be used to track its status.

#### Example

Request body:

```json
{
  "address_type": 1,
  "user_address": "0x1867...ca40",
  "user_signature": "0xae398...01b1b",
  "game_input": "c|3|3|10|75||jungle|jaguar",
  "timestamp": "1662980330784"
}
```

Negative responses:

```json
{
  "success": false,
  "message": "Input has already been submitted"
}
```

```json
{
  "success": false,
  "message": "Invalid request options"
}
```

Positive response:

```json
{
  "success": true,
  "hash": "0x69ac7ec96b8a314d19931fb3a3d8f5678a0b22f82648b4eae6bcacbb443311ac"
}
```

### Submit Self-signed Input

```http
POST /submit_self_signed_input
```

See example for expected format of body parameter. For the full functionality to be available, the endpoint needs to be enabled in the .env file (`SELF_SIGNING_ENABLED="true"`) and needs an API key specified (`SELF_SIGNING_API_KEY="XXX"`).

Unlike the `/submit_user_input` endpoint, you don't need to specify `address_type`, `user_address` or `user_signature`, as these will all be provided by the batcher. You do however need to provide `api_key` which needs to be the same as the one in the .env file. The input is then immediately treated as validated and ready to be posted, skipping game input validation and address validation.

The response will be a JSON object containing a `boolean` field, `success`, determining whether the input was accepted or not.

- If `success` is `false`, a `string` field, `message`, will be present describing the reason for refusal.
- If `success` is `true`, a `string` field, `hash`, will be present containing a hash of the submitted input that can be used to track its status.

#### Example

Request body:

```json
{
  "game_input": "fff|afeahjk|324789|6|fjhds",
  "timestamp": "1684495517803",
  "api_key": "XXX"
}
```

Negative responses:

```json
{
  "success": false,
  "message": "Endpoint disabled"
}
```

```json
{
  "success": false,
  "message": "Invalid API key"
}
```

```json
{
  "success": false,
  "message": "Input has already been submitted"
}
```

Positive response:

```json
{
  "success": true,
  "hash": "0x69ac7ec96b8a314d19931fb3a3d8f5678a0b22f82648b4eae6bcacbb443311ac"
}
```


### Track User Input

```http
GET /track_user_input
```

Query parameters:

| Parameter    | Type     | Description                                     |
| :----------- | :------- | :---------------------------------------------- |
| `input_hash` | `string` | Hash identifying the previously submitted input |

The response will be a JSON object containing a `boolean` field, `success`, determining whether the input corresponding to the supplied hash was found or not.

- If `success` is `false`, a `string` field, `message`, will be present describing the issue. If the query was formatted correctly but the specified hash was not found, it is included in the response as a field `string` field named `hash`.
- If `success` is `true`, a `string` field, `status`, will be present describing what stage of processing the request is currently in, with other fields depending on the status. Possible values for `status` are:
  - `'validating'` &ndash; input is still in the process of validation;
  - `'rejected'` &ndash; input has been rejected in the validation phase;
  - `'accepted'` &ndash; input has been accepted in the validation phase, but has not yet been posted;
  - `'posted'` &ndash; input has been accepted and successfully posted to the storage contract.

Note that you cannot track an input that wasn't successfully posted (it didn't receive a positive response from `submit_user_input`).

Positive response fields:

| Field              | Type      | Status     | Description                                              |
| :----------------- | :-------- | :--------- | :------------------------------------------------------- |
| `success`          | `boolean` | all        | Always `true` for positive responses                     |
| `status`           | `string`  | all        | The status of the queried input                          |
| `hash`             | `string`  | all        | The hash specified in the query                          |
| `message`          | `string`  | `rejected` | Explains the reason why the input was rejected           |
| `block_height`     | `integer` | `posted`   | The block number of the block where the input was posted |
| `transaction_hash` | `string`  | `posted`   | Hash of the transaction in which the input was posted    |

#### Example

Query:

```http
GET /track_user_input?input_hash=0x69ac7ec96b8a314d19931fb3a3d8f5678a0b22f82648b4eae6bcacbb443311ac
```

Negative response:

Response:

```json
{
  "success": false,
  "message": "Hash not found",
  "hash": "abcdefgh"
}
```

Positive responses:

```json
{
  "success": true,
  "hash": "0x69ac7ec96b8a314d19931fb3a3d8f5678a0b22f82648b4eae6bcacbb443311ac",
  "status": "rejected",
  "message": "The supplied game input does not correspond to any supported command"
}
```

```json
{
  "success": true,
  "hash": "0xd68c1c8e8996c4b7081f5a0bc897d7f9618a4ad89c53b08188c6244cd47f20e9",
  "status": "accepted"
}
```

```json
{
  "success": true,
  "hash": "0xd68c1c8e8996c4b7081f5a0bc897d7f9618a4ad89c53b08188c6244cd47f20e9",
  "status": "posted",
  "block_height": 10050484,
  "transaction_hash": "0x57ea...c871"
}
```

## Development

Install dependencies:

```
npm i
```

To test:

```
npm run test
```

Lint:

```
npm run lint
```
