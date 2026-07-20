# SwapPay Example JS

This is a simple example of how to use the SwapPay API to create a payment system for your website/bot.

For more info please check our [API Docs](https://docs.swapwallet.app).

## Usage

### Start

```bash
npm start
```

### Format

```bash
# format files
npx @biomejs/biome format --write

# lint files and apply the safe fixes
npx @biomejs/biome lint --write

# run format, lint, etc. and apply the safe fixes
npx @biomejs/biome check --write
```

## Deploy

first copy `.env-example` to `.env` and fill env variables with your credentials and then run application with docker-compose:

```bash
docker-compose up -d
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
