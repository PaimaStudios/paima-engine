# aiken-mdx

A tool to generate mdx documentation for `plutus.json` files generated from Aiken

You can see what the output looks like visually [here](https://docs.paimastudios.com/home/libraries/cardano-contracts/contrats)

## How to use

`aiken-md` comes with two parts to it:

1. Command-line options for generating documentation from Aiken projects
1. A set of UI components meant to help render the resulting generated docs in [docusaurus](https://github.com/facebook/docusaurus)

### Command-line tools

There are 2 options for using `aiken-md`

#### Single-file mode

Single-file mode outputs MDX documentation for a single project. This is useful if you prefer organizing your docs with 1 page per Aiken project

`npx aiken-mdx --single <path-to-plutus.json> --output <output-path.mdx>`

### #Multi-file mode

Single-file mode outputs MDX documentation for multiple projects at once. This is useful if you prefer organizing your docs with 1 page for all your Aiken project

`npx aiken-mdx --single <path-to-template.hbs> --output <output-path.mdx>`

To specify which projects to import and where to place them on the page, you need to specify a template [handlebar](https://handlebarsjs.com/) file

```hbs
# My contract library Data structures:
<ul>
  <li>[Some data structure](#aiken-project-title): My cool data structure.</li>
</ul>

Helper contracts:
<ul>
  <li>[Some helper contract](#aiken-project-title): My cool helper contract.</li>
</ul>

## Core contracts

{{{import '../data-structure-project'}}}

## Helper contracts

{{{import '../helper-contract-project'}}}
```

### Docusaurus utils

Docusaurus integration is simple!

1. `npm install @paima/aiken-mdx` in your docusaurus project
2. copy-paste the resulting mdx file inside your docs

## Read more

- [CIP57](https://github.com/cardano-foundation/CIPs/blob/master/CIP-0057) which defines the `plutus.json` format
