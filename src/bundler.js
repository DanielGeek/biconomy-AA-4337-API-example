"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUserOperation = void 0;
const ethers_1 = require("ethers");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const sepoliaNetwork = {
    name: 'sepolia',
    chainId: 11155111,
};
const alchemyUrl = `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
const provider = new ethers_1.ethers.providers.JsonRpcProvider(alchemyUrl, sepoliaNetwork);
const wallets = [
    new ethers_1.ethers.Wallet(process.env.PRIVATE_KEY_1, provider),
    new ethers_1.ethers.Wallet(process.env.PRIVATE_KEY_2, provider),
    new ethers_1.ethers.Wallet(process.env.PRIVATE_KEY_3, provider),
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
const entryPointContract = new ethers_1.ethers.Contract(entryPointAddress, abi, wallets[0]);
const handleUserOperation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const gasPrice = yield provider.getGasPrice();
        const estimatedGas = yield entryPointContract.estimateGas.handleOps(ops, beneficiary).catch(() => ethers_1.ethers.BigNumber.from("1000000")); // Fallback gas limit if estimation fails
        const randomWallet = wallets[Math.floor(Math.random() * wallets.length)];
        entryPointContract.connect(randomWallet);
        const txResponse = yield entryPointContract.handleOps(ops, beneficiary, {
            gasLimit: estimatedGas,
            gasPrice: gasPrice,
        });
        const receipt = yield txResponse.wait();
        return res.json({ jsonrpc: '2.0', result: receipt.transactionHash, id });
    }
    catch (error) {
        console.error('Error sending transaction:', error);
        if (typeof error === "object" && error !== null && "message" in error) {
            const ethError = error;
            return res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: `Error message: ${ethError.message}${ethError.code ? `, Code: ${ethError.code}` : ''}${ethError.reason ? `, Reason: ${ethError.reason}` : ''}${ethError.transactionHash ? `, Transaction Hash: ${ethError.transactionHash}` : ''}`
                },
                id
            });
        }
        else {
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
});
exports.handleUserOperation = handleUserOperation;
