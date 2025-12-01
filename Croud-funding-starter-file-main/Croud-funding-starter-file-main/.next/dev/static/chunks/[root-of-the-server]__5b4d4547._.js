(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[turbopack]/browser/dev/hmr-client/hmr-client.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/// <reference path="../../../shared/runtime-types.d.ts" />
/// <reference path="../../runtime/base/dev-globals.d.ts" />
/// <reference path="../../runtime/base/dev-protocol.d.ts" />
/// <reference path="../../runtime/base/dev-extensions.ts" />
__turbopack_context__.s([
    "connect",
    ()=>connect,
    "setHooks",
    ()=>setHooks,
    "subscribeToUpdate",
    ()=>subscribeToUpdate
]);
function connect({ addMessageListener, sendMessage, onUpdateError = console.error }) {
    addMessageListener((msg)=>{
        switch(msg.type){
            case 'turbopack-connected':
                handleSocketConnected(sendMessage);
                break;
            default:
                try {
                    if (Array.isArray(msg.data)) {
                        for(let i = 0; i < msg.data.length; i++){
                            handleSocketMessage(msg.data[i]);
                        }
                    } else {
                        handleSocketMessage(msg.data);
                    }
                    applyAggregatedUpdates();
                } catch (e) {
                    console.warn('[Fast Refresh] performing full reload\n\n' + "Fast Refresh will perform a full reload when you edit a file that's imported by modules outside of the React rendering tree.\n" + 'You might have a file which exports a React component but also exports a value that is imported by a non-React component file.\n' + 'Consider migrating the non-React component export to a separate file and importing it into both files.\n\n' + 'It is also possible the parent component of the component you edited is a class component, which disables Fast Refresh.\n' + 'Fast Refresh requires at least one parent function component in your React tree.');
                    onUpdateError(e);
                    location.reload();
                }
                break;
        }
    });
    const queued = globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS;
    if (queued != null && !Array.isArray(queued)) {
        throw new Error('A separate HMR handler was already registered');
    }
    globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS = {
        push: ([chunkPath, callback])=>{
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    };
    if (Array.isArray(queued)) {
        for (const [chunkPath, callback] of queued){
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    }
}
const updateCallbackSets = new Map();
function sendJSON(sendMessage, message) {
    sendMessage(JSON.stringify(message));
}
function resourceKey(resource) {
    return JSON.stringify({
        path: resource.path,
        headers: resource.headers || null
    });
}
function subscribeToUpdates(sendMessage, resource) {
    sendJSON(sendMessage, {
        type: 'turbopack-subscribe',
        ...resource
    });
    return ()=>{
        sendJSON(sendMessage, {
            type: 'turbopack-unsubscribe',
            ...resource
        });
    };
}
function handleSocketConnected(sendMessage) {
    for (const key of updateCallbackSets.keys()){
        subscribeToUpdates(sendMessage, JSON.parse(key));
    }
}
// we aggregate all pending updates until the issues are resolved
const chunkListsWithPendingUpdates = new Map();
function aggregateUpdates(msg) {
    const key = resourceKey(msg.resource);
    let aggregated = chunkListsWithPendingUpdates.get(key);
    if (aggregated) {
        aggregated.instruction = mergeChunkListUpdates(aggregated.instruction, msg.instruction);
    } else {
        chunkListsWithPendingUpdates.set(key, msg);
    }
}
function applyAggregatedUpdates() {
    if (chunkListsWithPendingUpdates.size === 0) return;
    hooks.beforeRefresh();
    for (const msg of chunkListsWithPendingUpdates.values()){
        triggerUpdate(msg);
    }
    chunkListsWithPendingUpdates.clear();
    finalizeUpdate();
}
function mergeChunkListUpdates(updateA, updateB) {
    let chunks;
    if (updateA.chunks != null) {
        if (updateB.chunks == null) {
            chunks = updateA.chunks;
        } else {
            chunks = mergeChunkListChunks(updateA.chunks, updateB.chunks);
        }
    } else if (updateB.chunks != null) {
        chunks = updateB.chunks;
    }
    let merged;
    if (updateA.merged != null) {
        if (updateB.merged == null) {
            merged = updateA.merged;
        } else {
            // Since `merged` is an array of updates, we need to merge them all into
            // one, consistent update.
            // Since there can only be `EcmascriptMergeUpdates` in the array, there is
            // no need to key on the `type` field.
            let update = updateA.merged[0];
            for(let i = 1; i < updateA.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateA.merged[i]);
            }
            for(let i = 0; i < updateB.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateB.merged[i]);
            }
            merged = [
                update
            ];
        }
    } else if (updateB.merged != null) {
        merged = updateB.merged;
    }
    return {
        type: 'ChunkListUpdate',
        chunks,
        merged
    };
}
function mergeChunkListChunks(chunksA, chunksB) {
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    return chunks;
}
function mergeChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted' || updateA.type === 'deleted' && updateB.type === 'added') {
        return undefined;
    }
    if (updateA.type === 'partial') {
        invariant(updateA.instruction, 'Partial updates are unsupported');
    }
    if (updateB.type === 'partial') {
        invariant(updateB.instruction, 'Partial updates are unsupported');
    }
    return undefined;
}
function mergeChunkListEcmascriptMergedUpdates(mergedA, mergedB) {
    const entries = mergeEcmascriptChunkEntries(mergedA.entries, mergedB.entries);
    const chunks = mergeEcmascriptChunksUpdates(mergedA.chunks, mergedB.chunks);
    return {
        type: 'EcmascriptMergedUpdate',
        entries,
        chunks
    };
}
function mergeEcmascriptChunkEntries(entriesA, entriesB) {
    return {
        ...entriesA,
        ...entriesB
    };
}
function mergeEcmascriptChunksUpdates(chunksA, chunksB) {
    if (chunksA == null) {
        return chunksB;
    }
    if (chunksB == null) {
        return chunksA;
    }
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeEcmascriptChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    if (Object.keys(chunks).length === 0) {
        return undefined;
    }
    return chunks;
}
function mergeEcmascriptChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted') {
        // These two completely cancel each other out.
        return undefined;
    }
    if (updateA.type === 'deleted' && updateB.type === 'added') {
        const added = [];
        const deleted = [];
        const deletedModules = new Set(updateA.modules ?? []);
        const addedModules = new Set(updateB.modules ?? []);
        for (const moduleId of addedModules){
            if (!deletedModules.has(moduleId)) {
                added.push(moduleId);
            }
        }
        for (const moduleId of deletedModules){
            if (!addedModules.has(moduleId)) {
                deleted.push(moduleId);
            }
        }
        if (added.length === 0 && deleted.length === 0) {
            return undefined;
        }
        return {
            type: 'partial',
            added,
            deleted
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'partial') {
        const added = new Set([
            ...updateA.added ?? [],
            ...updateB.added ?? []
        ]);
        const deleted = new Set([
            ...updateA.deleted ?? [],
            ...updateB.deleted ?? []
        ]);
        if (updateB.added != null) {
            for (const moduleId of updateB.added){
                deleted.delete(moduleId);
            }
        }
        if (updateB.deleted != null) {
            for (const moduleId of updateB.deleted){
                added.delete(moduleId);
            }
        }
        return {
            type: 'partial',
            added: [
                ...added
            ],
            deleted: [
                ...deleted
            ]
        };
    }
    if (updateA.type === 'added' && updateB.type === 'partial') {
        const modules = new Set([
            ...updateA.modules ?? [],
            ...updateB.added ?? []
        ]);
        for (const moduleId of updateB.deleted ?? []){
            modules.delete(moduleId);
        }
        return {
            type: 'added',
            modules: [
                ...modules
            ]
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'deleted') {
        // We could eagerly return `updateB` here, but this would potentially be
        // incorrect if `updateA` has added modules.
        const modules = new Set(updateB.modules ?? []);
        if (updateA.added != null) {
            for (const moduleId of updateA.added){
                modules.delete(moduleId);
            }
        }
        return {
            type: 'deleted',
            modules: [
                ...modules
            ]
        };
    }
    // Any other update combination is invalid.
    return undefined;
}
function invariant(_, message) {
    throw new Error(`Invariant: ${message}`);
}
const CRITICAL = [
    'bug',
    'error',
    'fatal'
];
function compareByList(list, a, b) {
    const aI = list.indexOf(a) + 1 || list.length;
    const bI = list.indexOf(b) + 1 || list.length;
    return aI - bI;
}
const chunksWithIssues = new Map();
function emitIssues() {
    const issues = [];
    const deduplicationSet = new Set();
    for (const [_, chunkIssues] of chunksWithIssues){
        for (const chunkIssue of chunkIssues){
            if (deduplicationSet.has(chunkIssue.formatted)) continue;
            issues.push(chunkIssue);
            deduplicationSet.add(chunkIssue.formatted);
        }
    }
    sortIssues(issues);
    hooks.issues(issues);
}
function handleIssues(msg) {
    const key = resourceKey(msg.resource);
    let hasCriticalIssues = false;
    for (const issue of msg.issues){
        if (CRITICAL.includes(issue.severity)) {
            hasCriticalIssues = true;
        }
    }
    if (msg.issues.length > 0) {
        chunksWithIssues.set(key, msg.issues);
    } else if (chunksWithIssues.has(key)) {
        chunksWithIssues.delete(key);
    }
    emitIssues();
    return hasCriticalIssues;
}
const SEVERITY_ORDER = [
    'bug',
    'fatal',
    'error',
    'warning',
    'info',
    'log'
];
const CATEGORY_ORDER = [
    'parse',
    'resolve',
    'code generation',
    'rendering',
    'typescript',
    'other'
];
function sortIssues(issues) {
    issues.sort((a, b)=>{
        const first = compareByList(SEVERITY_ORDER, a.severity, b.severity);
        if (first !== 0) return first;
        return compareByList(CATEGORY_ORDER, a.category, b.category);
    });
}
const hooks = {
    beforeRefresh: ()=>{},
    refresh: ()=>{},
    buildOk: ()=>{},
    issues: (_issues)=>{}
};
function setHooks(newHooks) {
    Object.assign(hooks, newHooks);
}
function handleSocketMessage(msg) {
    sortIssues(msg.issues);
    handleIssues(msg);
    switch(msg.type){
        case 'issues':
            break;
        case 'partial':
            // aggregate updates
            aggregateUpdates(msg);
            break;
        default:
            // run single update
            const runHooks = chunkListsWithPendingUpdates.size === 0;
            if (runHooks) hooks.beforeRefresh();
            triggerUpdate(msg);
            if (runHooks) finalizeUpdate();
            break;
    }
}
function finalizeUpdate() {
    hooks.refresh();
    hooks.buildOk();
    // This is used by the Next.js integration test suite to notify it when HMR
    // updates have been completed.
    // TODO: Only run this in test environments (gate by `process.env.__NEXT_TEST_MODE`)
    if (globalThis.__NEXT_HMR_CB) {
        globalThis.__NEXT_HMR_CB();
        globalThis.__NEXT_HMR_CB = null;
    }
}
function subscribeToChunkUpdate(chunkListPath, sendMessage, callback) {
    return subscribeToUpdate({
        path: chunkListPath
    }, sendMessage, callback);
}
function subscribeToUpdate(resource, sendMessage, callback) {
    const key = resourceKey(resource);
    let callbackSet;
    const existingCallbackSet = updateCallbackSets.get(key);
    if (!existingCallbackSet) {
        callbackSet = {
            callbacks: new Set([
                callback
            ]),
            unsubscribe: subscribeToUpdates(sendMessage, resource)
        };
        updateCallbackSets.set(key, callbackSet);
    } else {
        existingCallbackSet.callbacks.add(callback);
        callbackSet = existingCallbackSet;
    }
    return ()=>{
        callbackSet.callbacks.delete(callback);
        if (callbackSet.callbacks.size === 0) {
            callbackSet.unsubscribe();
            updateCallbackSets.delete(key);
        }
    };
}
function triggerUpdate(msg) {
    const key = resourceKey(msg.resource);
    const callbackSet = updateCallbackSets.get(key);
    if (!callbackSet) {
        return;
    }
    for (const callback of callbackSet.callbacks){
        callback(msg);
    }
    if (msg.type === 'notFound') {
        // This indicates that the resource which we subscribed to either does not exist or
        // has been deleted. In either case, we should clear all update callbacks, so if a
        // new subscription is created for the same resource, it will send a new "subscribe"
        // message to the server.
        // No need to send an "unsubscribe" message to the server, it will have already
        // dropped the update stream before sending the "notFound" message.
        updateCallbackSets.delete(key);
    }
}
}),
"[project]/Croud-funding-starter-file-main/Components/Footer.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/index.js [client] (ecmascript)");
;
;
const Footer = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: "Footer"
    }, void 0, false, {
        fileName: "[project]/Croud-funding-starter-file-main/Components/Footer.jsx",
        lineNumber: 4,
        columnNumber: 10
    }, ("TURBOPACK compile-time value", void 0));
};
_c = Footer;
const __TURBOPACK__default__export__ = Footer;
var _c;
__turbopack_context__.k.register(_c, "Footer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Croud-funding-starter-file-main/Context/CrowdFunding.json (json)", ((__turbopack_context__) => {

__turbopack_context__.v(JSON.parse("{\"_format\":\"hh-sol-artifact-1\",\"contractName\":\"CrowdFunding\",\"sourceName\":\"contracts/CrowdFunding.sol\",\"abi\":[{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"campaigns\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"title\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"description\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"target\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"deadline\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"amountCollected\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"_owner\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"_title\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"_description\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"_target\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"_deadline\",\"type\":\"uint256\"}],\"name\":\"createCampaign\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_id\",\"type\":\"uint256\"}],\"name\":\"donateToCampaign\",\"outputs\":[],\"stateMutability\":\"payable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getCampaigns\",\"outputs\":[{\"internalType\":\"address[]\",\"name\":\"owners\",\"type\":\"address[]\"},{\"internalType\":\"string[]\",\"name\":\"titles\",\"type\":\"string[]\"},{\"internalType\":\"string[]\",\"name\":\"descriptions\",\"type\":\"string[]\"},{\"internalType\":\"uint256[]\",\"name\":\"targets\",\"type\":\"uint256[]\"},{\"internalType\":\"uint256[]\",\"name\":\"deadlines\",\"type\":\"uint256[]\"},{\"internalType\":\"uint256[]\",\"name\":\"amountCollected\",\"type\":\"uint256[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_id\",\"type\":\"uint256\"}],\"name\":\"getDonators\",\"outputs\":[{\"internalType\":\"address[]\",\"name\":\"\",\"type\":\"address[]\"},{\"internalType\":\"uint256[]\",\"name\":\"\",\"type\":\"uint256[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"numberOfCampaigns\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"}],\"bytecode\":\"0x6080604052600060015534801561001557600080fd5b5061191c806100256000396000f3fe6080604052600436106100555760003560e01c8063075843c31461005a57806307ca140d146100975780630fa91fa9146100c2578063141961bc1461010057806342a4fda814610142578063a6b036331461015e575b600080fd5b34801561006657600080fd5b50610081600480360381019061007c9190610d8d565b61018e565b60405161008e9190610e4f565b60405180910390f35b3480156100a357600080fd5b506100ac61029f565b6040516100b99190610e4f565b60405180910390f35b3480156100ce57600080fd5b506100e960048036038101906100e49190610e6a565b6102a5565b6040516100f7929190611013565b60405180910390f35b34801561010c57600080fd5b5061012760048036038101906101229190610e6a565b6103b5565b604051610139969594939291906110d8565b60405180910390f35b61015c60048036038101906101579190610e6a565b610521565b005b34801561016a57600080fd5b5061017361074a565b60405161018596959493929190611253565b60405180910390f35b60004282116101d2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101c990611350565b60405180910390fd5b600080600060015481526020019081526020016000209050868160000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508581600101908161023e919061157c565b5084816002019081610250919061157c565b5083816003018190555082816004018190555060008160050181905550600160008154809291906102809061167d565b91905055506001805461029391906116c5565b91505095945050505050565b60015481565b6060806000808481526020019081526020016000206006016000808581526020019081526020016000206007018180548060200260200160405190810160405280929190818152602001828054801561035357602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019060010190808311610309575b50505050509150808054806020026020016040519081016040528092919081815260200182805480156103a557602002820191906000526020600020905b815481526020019060010190808311610391575b5050505050905091509150915091565b60006020528060005260406000206000915090508060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16908060010180546103fe9061139f565b80601f016020809104026020016040519081016040528092919081815260200182805461042a9061139f565b80156104775780601f1061044c57610100808354040283529160200191610477565b820191906000526020600020905b81548152906001019060200180831161045a57829003601f168201915b50505050509080600201805461048c9061139f565b80601f01602080910402602001604051908101604052809291908181526020018280546104b89061139f565b80156105055780601f106104da57610100808354040283529160200191610505565b820191906000526020600020905b8154815290600101906020018083116104e857829003601f168201915b5050505050908060030154908060040154908060050154905086565b6001548110610565576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161055c90611745565b60405180910390fd5b600034116105a8576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161059f906117b1565b60405180910390fd5b60003490506000806000848152602001908152602001600020905080600601339080600181540180825580915050600190039060005260206000200160009091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508060070182908060018154018082558091505060019003906000526020600020016000909190919091505560008160000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168360405161069d90611802565b60006040518083038185875af1925050503d80600081146106da576040519150601f19603f3d011682016040523d82523d6000602084013e6106df565b606091505b50509050801561070957828260050160008282546106fd9190611817565b92505081905550610744565b6040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161073b90611897565b60405180910390fd5b50505050565b60608060608060608060015467ffffffffffffffff81111561076f5761076e610c2c565b5b60405190808252806020026020018201604052801561079d5781602001602082028036833780820191505090505b50955060015467ffffffffffffffff8111156107bc576107bb610c2c565b5b6040519080825280602002602001820160405280156107ef57816020015b60608152602001906001900390816107da5790505b50945060015467ffffffffffffffff81111561080e5761080d610c2c565b5b60405190808252806020026020018201604052801561084157816020015b606081526020019060019003908161082c5790505b50935060015467ffffffffffffffff8111156108605761085f610c2c565b5b60405190808252806020026020018201604052801561088e5781602001602082028036833780820191505090505b50925060015467ffffffffffffffff8111156108ad576108ac610c2c565b5b6040519080825280602002602001820160405280156108db5781602001602082028036833780820191505090505b50915060015467ffffffffffffffff8111156108fa576108f9610c2c565b5b6040519080825280602002602001820160405280156109285781602001602082028036833780820191505090505b50905060005b600154811015610b9657600080600083815260200190815260200160002090508060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16888381518110610986576109856118b7565b5b602002602001019073ffffffffffffffffffffffffffffffffffffffff16908173ffffffffffffffffffffffffffffffffffffffff16815250508060010180546109cf9061139f565b80601f01602080910402602001604051908101604052809291908181526020018280546109fb9061139f565b8015610a485780601f10610a1d57610100808354040283529160200191610a48565b820191906000526020600020905b815481529060010190602001808311610a2b57829003601f168201915b5050505050878381518110610a6057610a5f6118b7565b5b6020026020010181905250806002018054610a7a9061139f565b80601f0160208091040260200160405190810160405280929190818152602001828054610aa69061139f565b8015610af35780601f10610ac857610100808354040283529160200191610af3565b820191906000526020600020905b815481529060010190602001808311610ad657829003601f168201915b5050505050868381518110610b0b57610b0a6118b7565b5b60200260200101819052508060030154858381518110610b2e57610b2d6118b7565b5b6020026020010181815250508060040154848381518110610b5257610b516118b7565b5b6020026020010181815250508060050154838381518110610b7657610b756118b7565b5b602002602001018181525050508080610b8e9061167d565b91505061092e565b50909192939495565b6000604051905090565b600080fd5b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610bde82610bb3565b9050919050565b610bee81610bd3565b8114610bf957600080fd5b50565b600081359050610c0b81610be5565b92915050565b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b610c6482610c1b565b810181811067ffffffffffffffff82111715610c8357610c82610c2c565b5b80604052505050565b6000610c96610b9f565b9050610ca28282610c5b565b919050565b600067ffffffffffffffff821115610cc257610cc1610c2c565b5b610ccb82610c1b565b9050602081019050919050565b82818337600083830152505050565b6000610cfa610cf584610ca7565b610c8c565b905082815260208101848484011115610d1657610d15610c16565b5b610d21848285610cd8565b509392505050565b600082601f830112610d3e57610d3d610c11565b5b8135610d4e848260208601610ce7565b91505092915050565b6000819050919050565b610d6a81610d57565b8114610d7557600080fd5b50565b600081359050610d8781610d61565b92915050565b600080600080600060a08688031215610da957610da8610ba9565b5b6000610db788828901610bfc565b955050602086013567ffffffffffffffff811115610dd857610dd7610bae565b5b610de488828901610d29565b945050604086013567ffffffffffffffff811115610e0557610e04610bae565b5b610e1188828901610d29565b9350506060610e2288828901610d78565b9250506080610e3388828901610d78565b9150509295509295909350565b610e4981610d57565b82525050565b6000602082019050610e646000830184610e40565b92915050565b600060208284031215610e8057610e7f610ba9565b5b6000610e8e84828501610d78565b91505092915050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b610ecc81610bd3565b82525050565b6000610ede8383610ec3565b60208301905092915050565b6000602082019050919050565b6000610f0282610e97565b610f0c8185610ea2565b9350610f1783610eb3565b8060005b83811015610f48578151610f2f8882610ed2565b9750610f3a83610eea565b925050600181019050610f1b565b5085935050505092915050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b610f8a81610d57565b82525050565b6000610f9c8383610f81565b60208301905092915050565b6000602082019050919050565b6000610fc082610f55565b610fca8185610f60565b9350610fd583610f71565b8060005b83811015611006578151610fed8882610f90565b9750610ff883610fa8565b925050600181019050610fd9565b5085935050505092915050565b6000604082019050818103600083015261102d8185610ef7565b905081810360208301526110418184610fb5565b90509392505050565b61105381610bd3565b82525050565b600081519050919050565b600082825260208201905092915050565b60005b83811015611093578082015181840152602081019050611078565b60008484015250505050565b60006110aa82611059565b6110b48185611064565b93506110c4818560208601611075565b6110cd81610c1b565b840191505092915050565b600060c0820190506110ed600083018961104a565b81810360208301526110ff818861109f565b90508181036040830152611113818761109f565b90506111226060830186610e40565b61112f6080830185610e40565b61113c60a0830184610e40565b979650505050505050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b600082825260208201905092915050565b600061118f82611059565b6111998185611173565b93506111a9818560208601611075565b6111b281610c1b565b840191505092915050565b60006111c98383611184565b905092915050565b6000602082019050919050565b60006111e982611147565b6111f38185611152565b93508360208202850161120585611163565b8060005b85811015611241578484038952815161122285826111bd565b945061122d836111d1565b925060208a01995050600181019050611209565b50829750879550505050505092915050565b600060c082019050818103600083015261126d8189610ef7565b9050818103602083015261128181886111de565b9050818103604083015261129581876111de565b905081810360608301526112a98186610fb5565b905081810360808301526112bd8185610fb5565b905081810360a08301526112d18184610fb5565b9050979650505050505050565b7f54686520646561646c696e652073686f756c642062652061206461746520696e60008201527f20746865206675747572652e0000000000000000000000000000000000000000602082015250565b600061133a602c83611064565b9150611345826112de565b604082019050919050565b600060208201905081810360008301526113698161132d565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806113b757607f821691505b6020821081036113ca576113c9611370565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026114327fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff826113f5565b61143c86836113f5565b95508019841693508086168417925050509392505050565b6000819050919050565b600061147961147461146f84610d57565b611454565b610d57565b9050919050565b6000819050919050565b6114938361145e565b6114a761149f82611480565b848454611402565b825550505050565b600090565b6114bc6114af565b6114c781848461148a565b505050565b5b818110156114eb576114e06000826114b4565b6001810190506114cd565b5050565b601f82111561153057611501816113d0565b61150a846113e5565b81016020851015611519578190505b61152d611525856113e5565b8301826114cc565b50505b505050565b600082821c905092915050565b600061155360001984600802611535565b1980831691505092915050565b600061156c8383611542565b9150826002028217905092915050565b61158582611059565b67ffffffffffffffff81111561159e5761159d610c2c565b5b6115a8825461139f565b6115b38282856114ef565b600060209050601f8311600181146115e657600084156115d4578287015190505b6115de8582611560565b865550611646565b601f1984166115f4866113d0565b60005b8281101561161c578489015182556001820191506020850194506020810190506115f7565b868310156116395784890151611635601f891682611542565b8355505b6001600288020188555050505b505050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061168882610d57565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82036116ba576116b961164e565b5b600182019050919050565b60006116d082610d57565b91506116db83610d57565b92508282039050818111156116f3576116f261164e565b5b92915050565b7f43616d706169676e20646f6573206e6f742065786973742e0000000000000000600082015250565b600061172f601883611064565b915061173a826116f9565b602082019050919050565b6000602082019050818103600083015261175e81611722565b9050919050565b7f446f6e6174696f6e206d7573742062652067726561746572207468616e20302e600082015250565b600061179b602083611064565b91506117a682611765565b602082019050919050565b600060208201905081810360008301526117ca8161178e565b9050919050565b600081905092915050565b50565b60006117ec6000836117d1565b91506117f7826117dc565b600082019050919050565b600061180d826117df565b9150819050919050565b600061182282610d57565b915061182d83610d57565b92508282019050808211156118455761184461164e565b5b92915050565b7f4661696c656420746f2073656e6420457468657220746f206f776e65722e0000600082015250565b6000611881601e83611064565b915061188c8261184b565b602082019050919050565b600060208201905081810360008301526118b081611874565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fdfea264697066735822122095326746122caed9e98fc5f8af42014b4d58be139d8481b43eb7f5d21263f70364736f6c63430008130033\",\"deployedBytecode\":\"0x6080604052600436106100555760003560e01c8063075843c31461005a57806307ca140d146100975780630fa91fa9146100c2578063141961bc1461010057806342a4fda814610142578063a6b036331461015e575b600080fd5b34801561006657600080fd5b50610081600480360381019061007c9190610d8d565b61018e565b60405161008e9190610e4f565b60405180910390f35b3480156100a357600080fd5b506100ac61029f565b6040516100b99190610e4f565b60405180910390f35b3480156100ce57600080fd5b506100e960048036038101906100e49190610e6a565b6102a5565b6040516100f7929190611013565b60405180910390f35b34801561010c57600080fd5b5061012760048036038101906101229190610e6a565b6103b5565b604051610139969594939291906110d8565b60405180910390f35b61015c60048036038101906101579190610e6a565b610521565b005b34801561016a57600080fd5b5061017361074a565b60405161018596959493929190611253565b60405180910390f35b60004282116101d2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101c990611350565b60405180910390fd5b600080600060015481526020019081526020016000209050868160000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508581600101908161023e919061157c565b5084816002019081610250919061157c565b5083816003018190555082816004018190555060008160050181905550600160008154809291906102809061167d565b91905055506001805461029391906116c5565b91505095945050505050565b60015481565b6060806000808481526020019081526020016000206006016000808581526020019081526020016000206007018180548060200260200160405190810160405280929190818152602001828054801561035357602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019060010190808311610309575b50505050509150808054806020026020016040519081016040528092919081815260200182805480156103a557602002820191906000526020600020905b815481526020019060010190808311610391575b5050505050905091509150915091565b60006020528060005260406000206000915090508060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16908060010180546103fe9061139f565b80601f016020809104026020016040519081016040528092919081815260200182805461042a9061139f565b80156104775780601f1061044c57610100808354040283529160200191610477565b820191906000526020600020905b81548152906001019060200180831161045a57829003601f168201915b50505050509080600201805461048c9061139f565b80601f01602080910402602001604051908101604052809291908181526020018280546104b89061139f565b80156105055780601f106104da57610100808354040283529160200191610505565b820191906000526020600020905b8154815290600101906020018083116104e857829003601f168201915b5050505050908060030154908060040154908060050154905086565b6001548110610565576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161055c90611745565b60405180910390fd5b600034116105a8576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161059f906117b1565b60405180910390fd5b60003490506000806000848152602001908152602001600020905080600601339080600181540180825580915050600190039060005260206000200160009091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508060070182908060018154018082558091505060019003906000526020600020016000909190919091505560008160000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168360405161069d90611802565b60006040518083038185875af1925050503d80600081146106da576040519150601f19603f3d011682016040523d82523d6000602084013e6106df565b606091505b50509050801561070957828260050160008282546106fd9190611817565b92505081905550610744565b6040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161073b90611897565b60405180910390fd5b50505050565b60608060608060608060015467ffffffffffffffff81111561076f5761076e610c2c565b5b60405190808252806020026020018201604052801561079d5781602001602082028036833780820191505090505b50955060015467ffffffffffffffff8111156107bc576107bb610c2c565b5b6040519080825280602002602001820160405280156107ef57816020015b60608152602001906001900390816107da5790505b50945060015467ffffffffffffffff81111561080e5761080d610c2c565b5b60405190808252806020026020018201604052801561084157816020015b606081526020019060019003908161082c5790505b50935060015467ffffffffffffffff8111156108605761085f610c2c565b5b60405190808252806020026020018201604052801561088e5781602001602082028036833780820191505090505b50925060015467ffffffffffffffff8111156108ad576108ac610c2c565b5b6040519080825280602002602001820160405280156108db5781602001602082028036833780820191505090505b50915060015467ffffffffffffffff8111156108fa576108f9610c2c565b5b6040519080825280602002602001820160405280156109285781602001602082028036833780820191505090505b50905060005b600154811015610b9657600080600083815260200190815260200160002090508060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16888381518110610986576109856118b7565b5b602002602001019073ffffffffffffffffffffffffffffffffffffffff16908173ffffffffffffffffffffffffffffffffffffffff16815250508060010180546109cf9061139f565b80601f01602080910402602001604051908101604052809291908181526020018280546109fb9061139f565b8015610a485780601f10610a1d57610100808354040283529160200191610a48565b820191906000526020600020905b815481529060010190602001808311610a2b57829003601f168201915b5050505050878381518110610a6057610a5f6118b7565b5b6020026020010181905250806002018054610a7a9061139f565b80601f0160208091040260200160405190810160405280929190818152602001828054610aa69061139f565b8015610af35780601f10610ac857610100808354040283529160200191610af3565b820191906000526020600020905b815481529060010190602001808311610ad657829003601f168201915b5050505050868381518110610b0b57610b0a6118b7565b5b60200260200101819052508060030154858381518110610b2e57610b2d6118b7565b5b6020026020010181815250508060040154848381518110610b5257610b516118b7565b5b6020026020010181815250508060050154838381518110610b7657610b756118b7565b5b602002602001018181525050508080610b8e9061167d565b91505061092e565b50909192939495565b6000604051905090565b600080fd5b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610bde82610bb3565b9050919050565b610bee81610bd3565b8114610bf957600080fd5b50565b600081359050610c0b81610be5565b92915050565b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b610c6482610c1b565b810181811067ffffffffffffffff82111715610c8357610c82610c2c565b5b80604052505050565b6000610c96610b9f565b9050610ca28282610c5b565b919050565b600067ffffffffffffffff821115610cc257610cc1610c2c565b5b610ccb82610c1b565b9050602081019050919050565b82818337600083830152505050565b6000610cfa610cf584610ca7565b610c8c565b905082815260208101848484011115610d1657610d15610c16565b5b610d21848285610cd8565b509392505050565b600082601f830112610d3e57610d3d610c11565b5b8135610d4e848260208601610ce7565b91505092915050565b6000819050919050565b610d6a81610d57565b8114610d7557600080fd5b50565b600081359050610d8781610d61565b92915050565b600080600080600060a08688031215610da957610da8610ba9565b5b6000610db788828901610bfc565b955050602086013567ffffffffffffffff811115610dd857610dd7610bae565b5b610de488828901610d29565b945050604086013567ffffffffffffffff811115610e0557610e04610bae565b5b610e1188828901610d29565b9350506060610e2288828901610d78565b9250506080610e3388828901610d78565b9150509295509295909350565b610e4981610d57565b82525050565b6000602082019050610e646000830184610e40565b92915050565b600060208284031215610e8057610e7f610ba9565b5b6000610e8e84828501610d78565b91505092915050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b610ecc81610bd3565b82525050565b6000610ede8383610ec3565b60208301905092915050565b6000602082019050919050565b6000610f0282610e97565b610f0c8185610ea2565b9350610f1783610eb3565b8060005b83811015610f48578151610f2f8882610ed2565b9750610f3a83610eea565b925050600181019050610f1b565b5085935050505092915050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b610f8a81610d57565b82525050565b6000610f9c8383610f81565b60208301905092915050565b6000602082019050919050565b6000610fc082610f55565b610fca8185610f60565b9350610fd583610f71565b8060005b83811015611006578151610fed8882610f90565b9750610ff883610fa8565b925050600181019050610fd9565b5085935050505092915050565b6000604082019050818103600083015261102d8185610ef7565b905081810360208301526110418184610fb5565b90509392505050565b61105381610bd3565b82525050565b600081519050919050565b600082825260208201905092915050565b60005b83811015611093578082015181840152602081019050611078565b60008484015250505050565b60006110aa82611059565b6110b48185611064565b93506110c4818560208601611075565b6110cd81610c1b565b840191505092915050565b600060c0820190506110ed600083018961104a565b81810360208301526110ff818861109f565b90508181036040830152611113818761109f565b90506111226060830186610e40565b61112f6080830185610e40565b61113c60a0830184610e40565b979650505050505050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b600082825260208201905092915050565b600061118f82611059565b6111998185611173565b93506111a9818560208601611075565b6111b281610c1b565b840191505092915050565b60006111c98383611184565b905092915050565b6000602082019050919050565b60006111e982611147565b6111f38185611152565b93508360208202850161120585611163565b8060005b85811015611241578484038952815161122285826111bd565b945061122d836111d1565b925060208a01995050600181019050611209565b50829750879550505050505092915050565b600060c082019050818103600083015261126d8189610ef7565b9050818103602083015261128181886111de565b9050818103604083015261129581876111de565b905081810360608301526112a98186610fb5565b905081810360808301526112bd8185610fb5565b905081810360a08301526112d18184610fb5565b9050979650505050505050565b7f54686520646561646c696e652073686f756c642062652061206461746520696e60008201527f20746865206675747572652e0000000000000000000000000000000000000000602082015250565b600061133a602c83611064565b9150611345826112de565b604082019050919050565b600060208201905081810360008301526113698161132d565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806113b757607f821691505b6020821081036113ca576113c9611370565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026114327fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff826113f5565b61143c86836113f5565b95508019841693508086168417925050509392505050565b6000819050919050565b600061147961147461146f84610d57565b611454565b610d57565b9050919050565b6000819050919050565b6114938361145e565b6114a761149f82611480565b848454611402565b825550505050565b600090565b6114bc6114af565b6114c781848461148a565b505050565b5b818110156114eb576114e06000826114b4565b6001810190506114cd565b5050565b601f82111561153057611501816113d0565b61150a846113e5565b81016020851015611519578190505b61152d611525856113e5565b8301826114cc565b50505b505050565b600082821c905092915050565b600061155360001984600802611535565b1980831691505092915050565b600061156c8383611542565b9150826002028217905092915050565b61158582611059565b67ffffffffffffffff81111561159e5761159d610c2c565b5b6115a8825461139f565b6115b38282856114ef565b600060209050601f8311600181146115e657600084156115d4578287015190505b6115de8582611560565b865550611646565b601f1984166115f4866113d0565b60005b8281101561161c578489015182556001820191506020850194506020810190506115f7565b868310156116395784890151611635601f891682611542565b8355505b6001600288020188555050505b505050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061168882610d57565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82036116ba576116b961164e565b5b600182019050919050565b60006116d082610d57565b91506116db83610d57565b92508282039050818111156116f3576116f261164e565b5b92915050565b7f43616d706169676e20646f6573206e6f742065786973742e0000000000000000600082015250565b600061172f601883611064565b915061173a826116f9565b602082019050919050565b6000602082019050818103600083015261175e81611722565b9050919050565b7f446f6e6174696f6e206d7573742062652067726561746572207468616e20302e600082015250565b600061179b602083611064565b91506117a682611765565b602082019050919050565b600060208201905081810360008301526117ca8161178e565b9050919050565b600081905092915050565b50565b60006117ec6000836117d1565b91506117f7826117dc565b600082019050919050565b600061180d826117df565b9150819050919050565b600061182282610d57565b915061182d83610d57565b92508282019050808211156118455761184461164e565b5b92915050565b7f4661696c656420746f2073656e6420457468657220746f206f776e65722e0000600082015250565b6000611881601e83611064565b915061188c8261184b565b602082019050919050565b600060208201905081810360008301526118b081611874565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fdfea264697066735822122095326746122caed9e98fc5f8af42014b4d58be139d8481b43eb7f5d21263f70364736f6c63430008130033\",\"linkReferences\":{},\"deployedLinkReferences\":{}}"));}),
"[project]/Croud-funding-starter-file-main/Components/Logo.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/index.js [client] (ecmascript)");
;
;
const Logo = ({ color })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        class: `w-8 ${color} text-teal-accent-400`,
        viewBox: "0 0 24 24",
        strokeLinejoin: "round",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeMiterlimit: "10",
        stroke: "currentColor",
        fill: "none",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "3",
                y: "1",
                width: "7",
                height: "12"
            }, void 0, false, {
                fileName: "[project]/Croud-funding-starter-file-main/Components/Logo.jsx",
                lineNumber: 15,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "3",
                y: "17",
                width: "7",
                height: "6"
            }, void 0, false, {
                fileName: "[project]/Croud-funding-starter-file-main/Components/Logo.jsx",
                lineNumber: 16,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "14",
                y: "1",
                width: "7",
                height: "6"
            }, void 0, false, {
                fileName: "[project]/Croud-funding-starter-file-main/Components/Logo.jsx",
                lineNumber: 17,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "14",
                y: "11",
                width: "7",
                height: "12"
            }, void 0, false, {
                fileName: "[project]/Croud-funding-starter-file-main/Components/Logo.jsx",
                lineNumber: 18,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Croud-funding-starter-file-main/Components/Logo.jsx",
        lineNumber: 5,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_c = Logo;
const __TURBOPACK__default__export__ = Logo;
var _c;
__turbopack_context__.k.register(_c, "Logo");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Croud-funding-starter-file-main/Components/Logo.jsx [client] (ecmascript) <export default as Logo>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Logo",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Logo$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Logo$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/Logo.jsx [client] (ecmascript)");
}),
"[project]/Croud-funding-starter-file-main/Components/menu.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/index.js [client] (ecmascript)");
;
;
const menu = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        class: "w-5 text-white",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                fill: "currentColor",
                d: "M23,13H1c-0.6,0-1-0.4-1-1s0.4-1,1-1h22c0.6,0,1,0.4,1,1S23.6,13,23,13z"
            }, void 0, false, {
                fileName: "[project]/Croud-funding-starter-file-main/Components/menu.jsx",
                lineNumber: 6,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                fill: "currentColor",
                d: "M23,6H1C0.4,6,0,5.6,0,5s0.4-1,1-1h22c0.6,0,1,0.4,1,1S23.6,6,23,6z"
            }, void 0, false, {
                fileName: "[project]/Croud-funding-starter-file-main/Components/menu.jsx",
                lineNumber: 10,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                fill: "currentColor",
                d: "M23,20H1c-0.6,0-1-0.4-1-1s0.4-1,1-1h22c0.6,0,1,0.4,1,1S23.6,20,23,20z"
            }, void 0, false, {
                fileName: "[project]/Croud-funding-starter-file-main/Components/menu.jsx",
                lineNumber: 14,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Croud-funding-starter-file-main/Components/menu.jsx",
        lineNumber: 5,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = menu;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Croud-funding-starter-file-main/Components/menu.jsx [client] (ecmascript) <export default as Menu>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Menu",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$menu$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$menu$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/menu.jsx [client] (ecmascript)");
}),
"[project]/Croud-funding-starter-file-main/Components/NavBar.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/index.js [client] (ecmascript)");
// INTERNAL IMPORTS
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Context$2f$CrowdFunding$2e$json__$28$json$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Context/CrowdFunding.json (json)");
// Assuming Logo and Menu components exist
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/index.js [client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Logo$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Logo$3e$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/Logo.jsx [client] (ecmascript) <export default as Logo>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$menu$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/menu.jsx [client] (ecmascript) <export default as Menu>");
;
var _s = __turbopack_context__.k.signature();
;
;
;
const NavBar = ()=>{
    _s();
    // Access state and functions from the context
    const { currentAccount, connectWallet } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Context$2f$CrowdFunding$2e$json__$28$json$29$__["CrowdFundingContext"]);
    // State for controlling the mobile menu's visibility
    const [isMenuOpen, setIsMenuOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Array of links for the navigation menu
    const menuList = [
        "White Paper",
        "Project",
        "Donation",
        "Members"
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "backgroundMain",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "px-4 py-5 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative flex items-center justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: "/",
                                "aria-label": "Company",
                                title: "Company",
                                className: "inline-flex items-center mr-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Logo$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Logo$3e$__["Logo"], {
                                        color: "text-white"
                                    }, void 0, false, {
                                        fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                        lineNumber: 32,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "ml-2 text-xl font-bold tracking-wide text-gray-100 uppercase",
                                        children: "Company"
                                    }, void 0, false, {
                                        fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                        lineNumber: 33,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                lineNumber: 26,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "flex items-center hidden space-x-8 lg:flex",
                                children: menuList.map((el, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: "/",
                                            "aria-label": "Our product",
                                            title: "Our product",
                                            className: "font-medium tracking-wide text-gray-100 transition-colors duration-200 hover:text-teal-accent-400",
                                            children: el
                                        }, void 0, false, {
                                            fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                            lineNumber: 42,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, i + 1, false, {
                                        fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                        lineNumber: 41,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)))
                            }, void 0, false, {
                                fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                lineNumber: 39,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                        lineNumber: 24,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    !currentAccount && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "flex items-center hidden space-x-8 lg:flex",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>connectWallet(),
                                className: "inline-flex items-center justify-center h-12 px-6 font-medium tracking-wide text-white transition duration-200 rounded shadow-md bg-deep-purple-accent-400 hover:bg-deep-purple-accent-700 focus:shadow-outline focus:outline-none background",
                                "aria-label": "Sign up",
                                title: "Sign up",
                                children: "Connect Wallet"
                            }, void 0, false, {
                                fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                lineNumber: 60,
                                columnNumber: 17
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                            lineNumber: 59,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                        lineNumber: 58,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "lg:hidden z-40",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            "aria-label": "Open Menu",
                            title: "Open Menu",
                            className: "p-2 -mr-1 transition duration-200 rounded focus:outline-none focus:shadow-outline",
                            onClick: ()=>setIsMenuOpen(true),
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$menu$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__["Menu"], {}, void 0, false, {
                                fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                lineNumber: 81,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                            lineNumber: 74,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                        lineNumber: 73,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    isMenuOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute top-0 left-0 w-full",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "p-5 bg-white border rounded shadow-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between mb-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                href: "/",
                                                "aria-label": "Company",
                                                title: "Company",
                                                className: "inline-flex items-center",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Logo$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Logo$3e$__["Logo"], {
                                                        color: "text-black"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                                        lineNumber: 100,
                                                        columnNumber: 35
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "ml-2 text-xl font-bold tracking-wide text-gray-800 uppercase",
                                                        children: "Company"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                                        lineNumber: 101,
                                                        columnNumber: 35
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                                lineNumber: 94,
                                                columnNumber: 31
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                            lineNumber: 92,
                                            columnNumber: 27
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                "aria-label": "Close Menu",
                                                title: "Close Menu",
                                                className: "p-2 -mt-2 -mr-2 transition duration-200 rounded hover:bg-gray-200 focus:bg-gray-200 focus:outline-none focus:shadow-outline",
                                                onClick: ()=>setIsMenuOpen(false),
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    className: "w-5 text-gray-600",
                                                    viewBox: "0 0 24 24",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        fill: "currentColor",
                                                        d: "M19.7,4.3c-0.4-0.4-1-0.4-1.4,0L12,10.6L5.7,4.3c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4l6.3,6.3l-6.3,6.3 c-0.4,0.4-0.4,1,0,1.4C4.5,19.9,4.7,20,5,20s0.5-0.1,0.7-0.3l6.3-6.3l6.3,6.3c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3 c0.4-0.4,0.4-1,0-1.4L13.4,12l6.3-6.3C20.1,5.3,20.1,4.7,19.7,4.3z"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                                        lineNumber: 117,
                                                        columnNumber: 39
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                                    lineNumber: 116,
                                                    columnNumber: 35
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                                lineNumber: 109,
                                                columnNumber: 31
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                            lineNumber: 108,
                                            columnNumber: 27
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                    lineNumber: 91,
                                    columnNumber: 23
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "space-y-4",
                                        children: [
                                            menuList.map((el, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                        href: "/",
                                                        "aria-label": "Our product",
                                                        title: "Our product",
                                                        className: "font-medium tracking-wide text-gray-700 transition-colors duration-200 hover:text-deep-purple-accent-400",
                                                        children: el
                                                    }, void 0, false, {
                                                        fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                                        lineNumber: 132,
                                                        columnNumber: 39
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, i + 1, false, {
                                                    fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                                    lineNumber: 131,
                                                    columnNumber: 35
                                                }, ("TURBOPACK compile-time value", void 0))),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                    href: "/",
                                                    onClick: ()=>connectWallet(),
                                                    className: "inline-flex items-center background justify-center w-full h-12 px-6 font-medium tracking-wide text-white transition duration-200 rounded shadow-md bg-deep-purple-accent-400 hover:bg-deep-purple-accent-700 focus:shadow-outline focus:outline-none",
                                                    "aria-label": "Connect Wallet",
                                                    title: "Connect Wallet",
                                                    children: "Connect Wallet"
                                                }, void 0, false, {
                                                    fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                                    lineNumber: 145,
                                                    columnNumber: 35
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                                lineNumber: 144,
                                                columnNumber: 31
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                        lineNumber: 128,
                                        columnNumber: 27
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                                    lineNumber: 127,
                                    columnNumber: 23
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                            lineNumber: 88,
                            columnNumber: 19
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                        lineNumber: 87,
                        columnNumber: 15
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
                lineNumber: 21,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
            lineNumber: 20,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/Croud-funding-starter-file-main/Components/NavBar.jsx",
        lineNumber: 19,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(NavBar, "5A1e2LCnQXh/rAHmrp2ki1bWiSw=");
_c = NavBar;
const __TURBOPACK__default__export__ = NavBar;
var _c;
__turbopack_context__.k.register(_c, "NavBar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Croud-funding-starter-file-main/Components/Hero.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/index.js [client] (ecmascript)");
;
;
const Hero = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: "Hero"
    }, void 0, false, {
        fileName: "[project]/Croud-funding-starter-file-main/Components/Hero.jsx",
        lineNumber: 4,
        columnNumber: 10
    }, ("TURBOPACK compile-time value", void 0));
};
_c = Hero;
const __TURBOPACK__default__export__ = Hero;
var _c;
__turbopack_context__.k.register(_c, "Hero");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Croud-funding-starter-file-main/Components/PupUp.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/index.js [client] (ecmascript)");
;
;
const PupUp = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: "PupUp"
    }, void 0, false, {
        fileName: "[project]/Croud-funding-starter-file-main/Components/PupUp.jsx",
        lineNumber: 4,
        columnNumber: 10
    }, ("TURBOPACK compile-time value", void 0));
};
_c = PupUp;
const __TURBOPACK__default__export__ = PupUp;
var _c;
__turbopack_context__.k.register(_c, "PupUp");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Croud-funding-starter-file-main/Components/Card.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/index.js [client] (ecmascript)");
;
;
const Card = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: "Card"
    }, void 0, false, {
        fileName: "[project]/Croud-funding-starter-file-main/Components/Card.jsx",
        lineNumber: 4,
        columnNumber: 10
    }, ("TURBOPACK compile-time value", void 0));
};
_c = Card;
const __TURBOPACK__default__export__ = Card;
var _c;
__turbopack_context__.k.register(_c, "Card");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Croud-funding-starter-file-main/Components/ICON.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/index.js [client] (ecmascript)");
;
;
const ICON = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        className: "absolute inset-x-0 bottom-0 text-white",
        viewBox: "0 0 1160 163",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            fill: "currentColor",
            d: "M-164 13L-104 39.7C-44 66 76 120 196 141C316 162 436 152 556 119.7C676 88 796 34 916 13C1036 -8 1156 2 1216 7.7L1276 13V162.5H1216C1156 162.5 1036 162.5 916 162.5C796 162.5 676 162.5 556 162.5C436 162.5 316 162.5 196 162.5C76 162.5 -44 162.5 -104 162.5H-164V13Z"
        }, void 0, false, {
            fileName: "[project]/Croud-funding-starter-file-main/Components/ICON.jsx",
            lineNumber: 9,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/Croud-funding-starter-file-main/Components/ICON.jsx",
        lineNumber: 5,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_c = ICON;
const __TURBOPACK__default__export__ = ICON;
var _c;
__turbopack_context__.k.register(_c, "ICON");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Croud-funding-starter-file-main/Components/Close.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/index.js [client] (ecmascript)");
;
;
const Close = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        class: "w-5 text-gray-600",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            fill: "currentColor",
            d: "M19.7,4.3c-0.4-0.4-1-0.4-1.4,0L12,10.6L5.7,4.3c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4l6.3,6.3l-6.3,6.3 c-0.4,0.4-0.4,1,0,1.4C4.5,19.9,4.7,20,5,20s0.5-0.1,0.7-0.3l6.3-6.3l6.3,6.3c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3 c0.4-0.4,0.4-1,0-1.4L13.4,12l6.3-6.3C20.1,5.3,20.1,4.7,19.7,4.3z"
        }, void 0, false, {
            fileName: "[project]/Croud-funding-starter-file-main/Components/Close.jsx",
            lineNumber: 6,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/Croud-funding-starter-file-main/Components/Close.jsx",
        lineNumber: 5,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_c = Close;
const __TURBOPACK__default__export__ = Close;
var _c;
__turbopack_context__.k.register(_c, "Close");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Croud-funding-starter-file-main/Components/Arrow.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/index.js [client] (ecmascript)");
;
;
const Arrow = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        className: "inline-block w-3 ml-2",
        fill: "currentColor",
        viewBox: "0 0 12 12",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M9.707,5.293l-5-5A1,1,0,0,0,3.293,1.707L7.586,6,3.293,10.293a1,1,0,1,0,1.414,1.414l5-5A1,1,0,0,0,9.707,5.293Z"
        }, void 0, false, {
            fileName: "[project]/Croud-funding-starter-file-main/Components/Arrow.jsx",
            lineNumber: 10,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/Croud-funding-starter-file-main/Components/Arrow.jsx",
        lineNumber: 5,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_c = Arrow;
const __TURBOPACK__default__export__ = Arrow;
var _c;
__turbopack_context__.k.register(_c, "Arrow");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Croud-funding-starter-file-main/Components/index.js [client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Footer$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/Footer.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$NavBar$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/NavBar.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Hero$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/Hero.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$PupUp$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/PupUp.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/Card.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Logo$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/Logo.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$menu$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/menu.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$ICON$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/ICON.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Close$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/Close.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Arrow$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/Arrow.jsx [client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Croud-funding-starter-file-main/Components/NavBar.jsx [client] (ecmascript) <export default as NavBar>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NavBar",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$NavBar$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$NavBar$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/NavBar.jsx [client] (ecmascript)");
}),
"[project]/Croud-funding-starter-file-main/Components/Footer.jsx [client] (ecmascript) <export default as Footer>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Footer",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Footer$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Footer$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/Footer.jsx [client] (ecmascript)");
}),
"[project]/Croud-funding-starter-file-main/Context/CroudFunding.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CrowdFundingContext",
    ()=>CrowdFundingContext,
    "CrowdFundingProvider",
    ()=>CrowdFundingProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$web3modal$2f$dist$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/web3modal/dist/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/ethers/lib.esm/ethers.js [client] (ecmascript) <export * as ethers>");
(()=>{
    const e = new Error("Cannot find module './constants'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
const CrowdFundingContext = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].createContext();
const fetchContract = (signerOrProvider)=>new __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].Contract(CrowdFundingAddress, CrowdFundingABI, signerOrProvider);
const CrowdFundingProvider = ({ children })=>{
    _s();
    const titleData = "Crowd Funding Contract";
    const [currentAccount, setCurrentAccount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    // ----------------------------------------------------------------
    // CREATE CAMPAIGN
    // ----------------------------------------------------------------
    const createCampaign = async (campaign)=>{
        const { title, description, amount, deadline } = campaign;
        try {
            const web3Modal = new __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$web3modal$2f$dist$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"]();
            const connection = await web3Modal.connect();
            const provider = new __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].providers.Web3Provider(connection);
            const signer = provider.getSigner();
            const contract = fetchContract(signer);
            const transaction = await contract.createCampaign(currentAccount, title, description, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.parseUnits(amount, 18), new Date(deadline).getTime());
            await transaction.wait();
            console.log("Contract call success:", transaction);
        } catch (error) {
            console.log("Contract call failure:", error);
        }
    };
    // ----------------------------------------------------------------
    // GET ALL CAMPAIGNS
    // ----------------------------------------------------------------
    const getCampaigns = async ()=>{
        const provider = new __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].providers.JsonRpcProvider();
        const contract = fetchContract(provider);
        const campaigns = await contract.getCampaigns();
        const parsedCampaigns = campaigns.title.map((_, i)=>({
                owner: campaigns.owners[i],
                title: campaigns.titles[i],
                description: campaigns.descriptions[i],
                target: __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.formatEther(campaigns.targets[i].toString()),
                deadline: campaigns.deadlines[i].toNumber(),
                amountCollected: __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.formatEther(campaigns.amountCollected[i].toString()),
                pId: i
            }));
        return parsedCampaigns;
    };
    // ----------------------------------------------------------------
    // GET USER CAMPAIGNS
    // ----------------------------------------------------------------
    const getUserCampaigns = async ()=>{
        const provider = new __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].providers.JsonRpcProvider();
        const contract = fetchContract(provider);
        const campaigns = await contract.getCampaigns();
        const accounts = await window.ethereum.request({
            method: "eth_accounts"
        });
        const currentUser = accounts[0];
        const parsedCampaigns = campaigns.titles.map((_, i)=>({
                owner: campaigns.owners[i],
                title: campaigns.titles[i],
                description: campaigns.descriptions[i],
                target: __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.formatEther(campaigns.targets[i].toString()),
                deadline: campaigns.deadlines[i].toNumber(),
                amountCollected: __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.formatEther(campaigns.amountCollected[i].toString()),
                pId: i
            })).filter((campaign)=>campaign.owner === currentUser);
        return parsedCampaigns;
    };
    // ----------------------------------------------------------------
    // DONATE
    // ----------------------------------------------------------------
    const donate = async (pId, amount)=>{
        try {
            const web3Modal = new __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$web3modal$2f$dist$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"]();
            const connection = await web3Modal.connect();
            const provider = new __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].providers.Web3Provider(connection);
            const signer = provider.getSigner();
            const contract = fetchContract(signer);
            const tx = await contract.donateToCampaign(pId, {
                value: __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.parseEther(amount)
            });
            await tx.wait();
            return tx;
        } catch (error) {
            console.log("Donation error:", error);
        }
    };
    // ----------------------------------------------------------------
    // GET DONATIONS
    // ----------------------------------------------------------------
    const getDonations = async (pId)=>{
        const provider = new __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].providers.JsonRpcProvider();
        const contract = fetchContract(provider);
        const donations = await contract.getDonators(pId);
        const numberOfDonations = donations[0].length;
        const parsedDonations = [];
        for(let i = 0; i < numberOfDonations; i++){
            parsedDonations.push({
                donator: donations[0][i],
                donation: __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.formatEther(donations[1][i].toString())
            });
        }
        return parsedDonations;
    };
    // ----------------------------------------------------------------
    // CHECK WALLET CONNECTED
    // ----------------------------------------------------------------
    const checkIfWalletConnected = async ()=>{
        try {
            if (!window.ethereum) {
                console.log("Install MetaMask");
                return;
            }
            const accounts = await window.ethereum.request({
                method: "eth_accounts"
            });
            if (accounts.length) {
                setCurrentAccount(accounts[0]);
            } else {
                console.log("No Account Found");
            }
        } catch (error) {
            console.log("Wallet connection error:", error);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CrowdFundingProvider.useEffect": ()=>{
            checkIfWalletConnected();
        }
    }["CrowdFundingProvider.useEffect"], []);
    // ----------------------------------------------------------------
    // CONNECT WALLET
    // ----------------------------------------------------------------
    const connectWallet = async ()=>{
        try {
            if (!window.ethereum) return console.log("Install MetaMask");
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts"
            });
            setCurrentAccount(accounts[0]);
        } catch (error) {
            console.log("Error while connecting wallet");
        }
    };
    // ----------------------------------------------------------------
    // PROVIDER RETURN
    // ----------------------------------------------------------------
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CrowdFundingContext.Provider, {
        value: {
            titleData,
            currentAccount,
            createCampaign,
            getCampaigns,
            getUserCampaigns,
            donate,
            getDonations,
            connectWallet
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/Croud-funding-starter-file-main/Context/CroudFunding.js",
        lineNumber: 193,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(CrowdFundingProvider, "Oez+vfH4X005OLgBo/Rzy9wdCKo=");
_c = CrowdFundingProvider;
var _c;
__turbopack_context__.k.register(_c, "CrowdFundingProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Croud-funding-starter-file-main/pages/_app.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>App
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
//INTERNAL IMPORT 
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/index.js [client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$NavBar$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__NavBar$3e$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/NavBar.jsx [client] (ecmascript) <export default as NavBar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Footer$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Footer$3e$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/Footer.jsx [client] (ecmascript) <export default as Footer>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Context$2f$CroudFunding$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Context/CroudFunding.js [client] (ecmascript)");
;
;
;
;
function App({ Component, pageProps }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Context$2f$CroudFunding$2e$js__$5b$client$5d$__$28$ecmascript$29$__["CrowdFundingProvider"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$NavBar$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__NavBar$3e$__["NavBar"], {}, void 0, false, {
                    fileName: "[project]/Croud-funding-starter-file-main/pages/_app.js",
                    lineNumber: 10,
                    columnNumber: 5
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Component, {
                    ...pageProps
                }, void 0, false, {
                    fileName: "[project]/Croud-funding-starter-file-main/pages/_app.js",
                    lineNumber: 11,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Footer$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Footer$3e$__["Footer"], {}, void 0, false, {
                    fileName: "[project]/Croud-funding-starter-file-main/pages/_app.js",
                    lineNumber: 12,
                    columnNumber: 5
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Croud-funding-starter-file-main/pages/_app.js",
            lineNumber: 9,
            columnNumber: 5
        }, this)
    }, void 0, false);
}
_c = App;
var _c;
__turbopack_context__.k.register(_c, "App");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/Croud-funding-starter-file-main/pages/_app.js [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/_app";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/Croud-funding-starter-file-main/pages/_app.js [client] (ecmascript)");
    }
]);
// @ts-expect-error module.hot exists
if (module.hot) {
    // @ts-expect-error module.hot exists
    module.hot.dispose(function() {
        window.__NEXT_P.push([
            PAGE_PATH
        ]);
    });
}
}),
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/Croud-funding-starter-file-main/pages/_app\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/Croud-funding-starter-file-main/pages/_app.js [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__5b4d4547._.js.map