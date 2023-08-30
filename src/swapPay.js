const axios = require('axios')

const NetworkMapping = {
    'TRX': 'TRON',
}

class SwapPay {
    constructor(swapWalletToken) {
        this.axios = axios.create({
            baseURL: 'https://pay.swapwallet.app/api',
            timeout: 30 * 1000,
            headers: {
                'Authorization': `Bearer ${swapWalletToken}`
            }
        })
    }

    async createInvoice(amount, token, ttl=3600) {
        try {
            const r = await this.axios.post('/v1/invoice/fixed-amount', {
                amount: {
                    number: String(amount),
                    token,
                },
                network: NetworkMapping[token],
                ttl,
            })

            return r.data.result
        } catch (e) {
            console.log(`ERROR CREATE INVOICE: ${e.message}`)
            throw Error(e.message)
        }
    }

    async getInvoiceStatus(invoiceId) {
        try {
            const r = await this.axios.get(`/v1/invoice/${invoiceId}`)
            return r.data.result
        } catch (e) {
            console.log(`ERROR CHECK INVOICE: ${e.message}`)
            throw Error(e.message)
        }
    }
}

module.exports = SwapPay;
