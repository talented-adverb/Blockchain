module.exports = [
"[project]/Croud-funding-starter-file-main/Components/Hero.jsx [ssr] (ecmascript) <export default as Hero>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Hero",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Hero$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Hero$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/Hero.jsx [ssr] (ecmascript)");
}),
"[project]/Croud-funding-starter-file-main/Components/Card.jsx [ssr] (ecmascript) <export default as Card>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Card",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Card$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Card$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/Card.jsx [ssr] (ecmascript)");
}),
"[project]/Croud-funding-starter-file-main/Components/PupUp.jsx [ssr] (ecmascript) <export default as PupUp>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PupUp",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$PupUp$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$PupUp$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/PupUp.jsx [ssr] (ecmascript)");
}),
"[project]/Croud-funding-starter-file-main/pages/index.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
// INTERNAL IMPORT
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Context$2f$CrowdFunding$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Context/CrowdFunding.js [ssr] (ecmascript)"); // Corrected spelling based on context
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$index$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/index.js [ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Hero$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Hero$3e$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/Hero.jsx [ssr] (ecmascript) <export default as Hero>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Card$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Card$3e$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/Card.jsx [ssr] (ecmascript) <export default as Card>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$PupUp$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PupUp$3e$__ = __turbopack_context__.i("[project]/Croud-funding-starter-file-main/Components/PupUp.jsx [ssr] (ecmascript) <export default as PupUp>");
;
;
;
;
const index = ()=>{
    // 1. EXTRACT DATA FROM CONTEXT (CrowdFundingContext)
    const { titleData, createCampaign, donate, getUserCampaigns, getDonations, getCampaigns: getCampaignsData, // getCampaigns is missing from context images but is used as getCampaignsData
    // in useEffect, assuming 'getCampaigns' was exported as 'getCampaigns' or
    // we should use the one extracted on line 9 (getCampaign) which is now renamed
    getCampaigns: getCampaignsContextFunction } = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Context$2f$CrowdFunding$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["CrowdFundingContext"]);
    // 2. STATE MANAGEMENT FOR CAMPAIGN DATA AND UI
    const [allcampaign, setAllcampaign] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])();
    const [usercampaign, setUsercampaign] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])();
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(true);
    // Toast notifications
    const [toast, setToast] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const showToast = (message, type = 'info')=>{
        setToast({
            message,
            type
        });
        setTimeout(()=>setToast(null), 4000);
    };
    // DONATE POPUP MODEL STATE
    const [openModel, setOpenModel] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [donateCampaign, setDonateCampaign] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(); // Holds the campaign object for donation
    // 3. EFFECT TO FETCH CAMPAIGN DATA ON MOUNT
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const fetchData = async ()=>{
            setLoading(true);
            try {
                const allData = await getCampaignsContextFunction();
                const userData = await getUserCampaigns();
                setAllcampaign(allData);
                setUsercampaign(userData);
            } catch (error) {
                console.error("Failed to fetch campaigns:", error);
                // Optionally set empty arrays or show error message
                setAllcampaign([]);
                setUsercampaign([]);
            } finally{
                setLoading(false);
            }
        };
        fetchData();
    }, [
        getCampaignsContextFunction,
        getUserCampaigns
    ]); // Include dependencies
    // Optional: Console log to verify state (based on image f15371.png)
    // console.log(donateCampaign); 
    // 4. COMPONENT RENDER
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Hero$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Hero$3e$__["Hero"], {
                titleData: titleData,
                createCampaign: createCampaign,
                showToast: showToast
            }, void 0, false, {
                fileName: "[project]/Croud-funding-starter-file-main/pages/index.js",
                lineNumber: 68,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Card$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Card$3e$__["Card"], {
                title: "All Listed Campaign",
                allcampaign: allcampaign,
                loading: loading,
                setOpenModel: setOpenModel,
                setDonate: setDonateCampaign
            }, void 0, false, {
                fileName: "[project]/Croud-funding-starter-file-main/pages/index.js",
                lineNumber: 71,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$Card$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Card$3e$__["Card"], {
                title: "Your Created Campaign",
                allcampaign: usercampaign,
                loading: loading,
                setOpenModel: setOpenModel,
                setDonate: setDonateCampaign
            }, void 0, false, {
                fileName: "[project]/Croud-funding-starter-file-main/pages/index.js",
                lineNumber: 80,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            openModel && donateCampaign && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Croud$2d$funding$2d$starter$2d$file$2d$main$2f$Components$2f$PupUp$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__PupUp$3e$__["PupUp"], {
                setOpenModel: setOpenModel,
                getDonations: getDonations,
                donate: donateCampaign,
                donateFunction: donate
            }, void 0, false, {
                fileName: "[project]/Croud-funding-starter-file-main/pages/index.js",
                lineNumber: 90,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true);
};
const __TURBOPACK__default__export__ = index;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__433b155c._.js.map