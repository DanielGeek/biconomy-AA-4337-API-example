import { Request, Response } from 'express';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

interface EthereumError extends Error {
    code?: string;
    reason?: string;
    transactionHash?: string;
    transaction?: any;
    receipt?: any;
}

interface ErrorResponse {
    jsonrpc: string;
    error: {
        code: number;
        message: string;
    };
    id: number | string;
}

const sepoliaNetwork = {
    name: 'sepolia',
    chainId: 11155111,
};

const alchemyUrl = `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
const provider = new ethers.providers.JsonRpcProvider(alchemyUrl, sepoliaNetwork);

const wallets = [
    new ethers.Wallet(process.env.PRIVATE_KEY_1!, provider),
    new ethers.Wallet(process.env.PRIVATE_KEY_2!, provider),
    new ethers.Wallet(process.env.PRIVATE_KEY_3!, provider),
];

const entryPointAddress = '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789';
const abi = [
    `function handleOps(tuple(
        address sender,
        uint256 nonce,
        bytes callData,
        bytes32 verificationGasAndData,
        uint256 maxFeePerGas,
        uint256 maxPriorityFeePerGas,
        bytes paymasterAndData,
        bytes signature
    )[] ops, address payable beneficiary)`
];
const entryPointContract = new ethers.Contract(entryPointAddress, abi, wallets[0]);

export const handleUserOperation = async (req: Request, res: Response) => {
    const { jsonrpc, method, params, id } = req.body;

    if (jsonrpc !== '2.0' || method !== 'eth_sendUserOperation') {
        return res.status(400).json({ jsonrpc: '2.0', error: { code: -32600, message: 'Invalid request' }, id });
    }

    if (!Array.isArray(params) || params.length === 0 || !params[0].ops || !params[0].beneficiary) {
        return res.status(400).json({ jsonrpc: '2.0', error: { code: -32602, message: 'Invalid parameters' }, id });
    }

    const ops = params[0].ops;
    const beneficiary = params[0].beneficiary;

    try {
        const gasPrice = await provider.getGasPrice();
        const estimatedGas = await entryPointContract.estimateGas.handleOps(ops, beneficiary).catch(() => ethers.BigNumber.from("1000000")); // Fallback gas limit if estimation fails

        const randomWallet = wallets[Math.floor(Math.random() * wallets.length)];
        entryPointContract.connect(randomWallet);

        const txResponse = await entryPointContract.handleOps(ops, beneficiary, {
            gasLimit: estimatedGas,
            gasPrice: gasPrice,
        });

        const receipt = await txResponse.wait();
        return res.json({ jsonrpc: '2.0', result: receipt.transactionHash, id });
    } catch (error: unknown) {
        console.error('Error sending transaction:', error);
        if (typeof error === "object" && error !== null && "message" in error) {
            const ethError = error as EthereumError;
            return res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: `Error message: ${ethError.message}${ethError.code ? `, Code: ${ethError.code}` : ''}${ethError.reason ? `, Reason: ${ethError.reason}` : ''}${ethError.transactionHash ? `, Transaction Hash: ${ethError.transactionHash}` : ''}`
                },
                id
            });
        } else {
            return res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: "An unexpected error occurred"
                },
                id
            });
        }
    }
};
