import { BrowserProvider, Contract } from 'ethers';

class WalletService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.isConnected = false;
    }

    async connectWallet() {
        try {
            // Check if MetaMask is installed
            if (typeof window.ethereum === 'undefined') {
                throw new Error('Please install MetaMask to use this feature');
            }

            // First check if already connected
            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });

            if (accounts.length === 0) {
                // Request connection if not already connected
                await window.ethereum.request({
                    method: 'wallet_requestPermissions',
                    params: [{
                        eth_accounts: {}
                    }]
                });

                // After permission granted, request accounts
                const newAccounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });

                if (newAccounts.length === 0) {
                    throw new Error('Please connect to MetaMask');
                }
            }
            
            // Create provider and signer
            this.provider = new BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            this.address = await this.signer.getAddress();
            this.isConnected = true;

            // Add listeners for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.address = accounts[0];
                }
            });

            // Add chain changed listener
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });

            return {
                success: true,
                address: this.address
            };
        } catch (error) {
            console.error('Error connecting wallet:', error);
            return {
                success: false,
                error: error.message || 'Failed to connect wallet'
            };
        }
    }

    disconnect() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.isConnected = false;
    }

    getAddress() {
        return this.address;
    }

    isWalletConnected() {
        return this.isConnected;
    }

    // Add this method if you want to implement transactions later
    async sendTransaction(to, amount) {
        if (!this.isConnected) {
            throw new Error('Wallet not connected');
        }

        try {
            const tx = await this.signer.sendTransaction({
                to: to,
                value: (amount * 1e18).toString() // Convert to wei
            });
            return tx;
        } catch (error) {
            console.error('Transaction error:', error);
            throw error;
        }
    }
}

export default new WalletService();
