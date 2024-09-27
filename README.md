# Directus Extension Encrypt Data

### This extension is intended for encrypting and decrypting data within Directus

### Add extension to project

1. Clone this repo.
2. Run the commands

```
npm install
```

```
npm run build
```

3. Create new directory with name `directus-extension-encrypt-data` in directory `extensions` of your project.
4. Copy directory `dist` with `index.js` file in it and `package.json` file from this repo into `directus-extension-encrypt-data` of your project.

### Set env for extension

| NAME                  | Required | Default value |
| --------------------- | :------: | ------------: |
| DE_CRYPTO_FIELD_START |    NO    | "encrypted\_" |
| DE_IS_DECRYPTED       |    NO    |        "true" |

#### Restart your Directus instance to complete the setup.

[Directus extension tutorial guide](https://store-restack.vercel.app/docs/directus-knowledge-directus-extension-tutorial)
