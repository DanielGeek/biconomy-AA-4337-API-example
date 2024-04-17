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

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
const entryPointAddress = '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789';
const entryPointContract = new ethers.Contract(
    entryPointAddress,
    [
        'function handleOps(tuple(' +
        'address sender, ' +
        'uint256 nonce, ' +
        'bytes callData, ' +
        'bytes32 verificationGasAndData, ' +
        'uint256 maxFeePerGas, ' +
        'uint256 maxPriorityFeePerGas, ' +
        'address paymaster, ' +
        'bytes signature' +
        ')[] ops, address payable beneficiary)'
    ],
    wallet
);


export const handleUserOperation = async (req: Request, res: Response) => {
    const { jsonrpc, method, params, id } = req.body;

    if (jsonrpc !== '2.0' || method !== 'eth_sendUserOperation') {
        return res.status(400).json({ jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id });
    }

    if (!Array.isArray(params) || params.length === 0 || !params[0].ops || !params[0].beneficiary) {
        return res.status(400).json({ jsonrpc: '2.0', error: { code: -32602, message: 'Invalid params' }, id });
    }

    const ops = params[0].ops;
    const beneficiary = params[0].beneficiary;

    try {
        const txResponse = await entryPointContract.handleOps(ops, beneficiary, {
            maxFeePerGas: ethers.utils.parseUnits("100", "gwei"),
            maxPriorityFeePerGas: ethers.utils.parseUnits("2", "gwei"),
            gasLimit: 1000000
        });

        const receipt = await txResponse.wait();
        return res.json({ jsonrpc: '2.0', result: receipt.transactionHash, id });
    } catch (error: unknown) {  // Cambiado de any a unknown para forzar la verificación de tipo
        console.error('Error sending transaction:', error);

        // Verifica que el error sea del tipo esperado
        if (typeof error === "object" && error !== null && "message" in error) {
            const ethError = error as EthereumError;  // Asignación de tipo

            // Prepara un mensaje basado en la información disponible
            let message = ethError.message;
            if (ethError.code) {
                message += ` (code: ${ethError.code})`;
            }
            if (ethError.reason) {
                message += ` Reason: ${ethError.reason}`;
            }
            if (ethError.transactionHash) {
                message += ` Transaction Hash: ${ethError.transactionHash}`;
            }

            // Envía la respuesta
            return res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message
                },
                id
            } as ErrorResponse);
        } else {
            // Si el error no es del tipo esperado, envía un mensaje genérico
            return res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: "An unexpected error occurred"
                },
                id
            } as ErrorResponse);
        }
    }
};


