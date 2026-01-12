module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/apps/gearbox-analyzer/stores/drivetrain-store.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useDrivetrainStore",
    ()=>useDrivetrainStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@xyflow/react/dist/esm/index.js [app-ssr] (ecmascript) <locals>");
"use client";
;
;
// Default parameters for each component type
const DEFAULT_PARAMS = {
    engine: {
        rpmIdle: 700,
        rpmMax: 1800,
        pRated: 1801000,
        tPeak: 11220
    },
    motor: {
        pMax: 200000,
        tMax: 3000,
        rpmMax: 6000,
        eta: 0.92
    },
    gearbox: {
        ratios: [
            4.59,
            2.95,
            1.94,
            1.40,
            1.0,
            0.74,
            0.65
        ],
        efficiencies: [
            0.97,
            0.97,
            0.97,
            0.97,
            0.97,
            0.97,
            0.97
        ]
    },
    planetary: {
        zSun: 30,
        zRing: 90
    },
    battery: {
        capacityKwh: 200,
        vNom: 700,
        pMaxDischarge: 1000000,
        pMaxCharge: 500000,
        socInit: 0.6
    },
    vehicle: {
        mEmpty: 159350,
        mPayload: 190000,
        rWheel: 1.78,
        cR: 0.025,
        vMax: 15.0
    }
};
// Counter for unique node IDs
let nodeIdCounter = 1;
const useDrivetrainStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])((set, get)=>({
        nodes: [],
        edges: [],
        selectedNodeId: null,
        addNode: (type, position)=>{
            const id = `${type}-${nodeIdCounter++}`;
            const newNode = {
                id,
                type: `${type}Node`,
                position,
                data: {
                    label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodeIdCounter - 1}`,
                    componentType: type,
                    params: {
                        ...DEFAULT_PARAMS[type]
                    }
                }
            };
            set((state)=>({
                    nodes: [
                        ...state.nodes,
                        newNode
                    ]
                }));
        },
        removeNode: (id)=>{
            set((state)=>({
                    nodes: state.nodes.filter((n)=>n.id !== id),
                    edges: state.edges.filter((e)=>e.source !== id && e.target !== id),
                    selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId
                }));
        },
        updateNodeParams: (id, params)=>{
            set((state)=>({
                    nodes: state.nodes.map((node)=>node.id === id ? {
                            ...node,
                            data: {
                                ...node.data,
                                params: {
                                    ...node.data.params,
                                    ...params
                                }
                            }
                        } : node)
                }));
        },
        setSelectedNode: (id)=>{
            set({
                selectedNodeId: id
            });
        },
        onNodesChange: (changes)=>{
            set((state)=>({
                    nodes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["applyNodeChanges"])(changes, state.nodes)
                }));
        },
        onEdgesChange: (changes)=>{
            set((state)=>({
                    edges: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["applyEdgeChanges"])(changes, state.edges)
                }));
        },
        addEdge: (edge)=>{
            set((state)=>({
                    edges: [
                        ...state.edges,
                        edge
                    ]
                }));
        },
        removeEdge: (id)=>{
            set((state)=>({
                    edges: state.edges.filter((e)=>e.id !== id)
                }));
        },
        validateTopology: ()=>{
            const { nodes, edges } = get();
            const errors = [];
            // Check for at least one engine or motor
            const hasActuator = nodes.some((n)=>n.data.componentType === "engine" || n.data.componentType === "motor");
            if (!hasActuator) {
                errors.push("Topology needs at least one engine or motor");
            }
            // Check for vehicle component
            const hasVehicle = nodes.some((n)=>n.data.componentType === "vehicle");
            if (!hasVehicle) {
                errors.push("Topology needs a vehicle component");
            }
            // Check connectivity (simplified)
            if (nodes.length > 1 && edges.length < nodes.length - 1) {
                errors.push("Some components are not connected");
            }
            return {
                isValid: errors.length === 0,
                errors
            };
        },
        loadPreset: (name)=>{
            // Clear current state
            nodeIdCounter = 1;
            switch(name){
                case "diesel-793d":
                    set({
                        nodes: [
                            {
                                id: "engine-1",
                                type: "engineNode",
                                position: {
                                    x: 100,
                                    y: 200
                                },
                                data: {
                                    label: "CAT 3516E",
                                    componentType: "engine",
                                    params: DEFAULT_PARAMS.engine
                                }
                            },
                            {
                                id: "gearbox-1",
                                type: "gearboxNode",
                                position: {
                                    x: 350,
                                    y: 200
                                },
                                data: {
                                    label: "7-Speed Gearbox",
                                    componentType: "gearbox",
                                    params: DEFAULT_PARAMS.gearbox
                                }
                            },
                            {
                                id: "vehicle-1",
                                type: "vehicleNode",
                                position: {
                                    x: 600,
                                    y: 200
                                },
                                data: {
                                    label: "CAT 793D",
                                    componentType: "vehicle",
                                    params: DEFAULT_PARAMS.vehicle
                                }
                            }
                        ],
                        edges: [
                            {
                                id: "e-engine-gearbox",
                                source: "engine-1",
                                target: "gearbox-1",
                                sourceHandle: "shaft",
                                targetHandle: "input",
                                type: "mechanical"
                            },
                            {
                                id: "e-gearbox-vehicle",
                                source: "gearbox-1",
                                target: "vehicle-1",
                                sourceHandle: "output",
                                targetHandle: "wheels",
                                type: "mechanical"
                            }
                        ],
                        selectedNodeId: null
                    });
                    nodeIdCounter = 4;
                    break;
                case "ecvt-split":
                    set({
                        nodes: [
                            {
                                id: "engine-1",
                                type: "engineNode",
                                position: {
                                    x: 100,
                                    y: 250
                                },
                                data: {
                                    label: "CAT 3516E",
                                    componentType: "engine",
                                    params: DEFAULT_PARAMS.engine
                                }
                            },
                            {
                                id: "motor-1",
                                type: "motorNode",
                                position: {
                                    x: 100,
                                    y: 100
                                },
                                data: {
                                    label: "MG1",
                                    componentType: "motor",
                                    params: {
                                        ...DEFAULT_PARAMS.motor,
                                        pMax: 200000,
                                        tMax: 3000
                                    }
                                }
                            },
                            {
                                id: "motor-2",
                                type: "motorNode",
                                position: {
                                    x: 500,
                                    y: 250
                                },
                                data: {
                                    label: "MG2",
                                    componentType: "motor",
                                    params: {
                                        ...DEFAULT_PARAMS.motor,
                                        pMax: 350000,
                                        tMax: 2000,
                                        pBoost: 500000
                                    }
                                }
                            },
                            {
                                id: "planetary-1",
                                type: "planetaryNode",
                                position: {
                                    x: 300,
                                    y: 175
                                },
                                data: {
                                    label: "Planetary",
                                    componentType: "planetary",
                                    params: DEFAULT_PARAMS.planetary
                                }
                            },
                            {
                                id: "gearbox-1",
                                type: "gearboxNode",
                                position: {
                                    x: 650,
                                    y: 250
                                },
                                data: {
                                    label: "2-Speed",
                                    componentType: "gearbox",
                                    params: {
                                        ratios: [
                                            5.0,
                                            0.67
                                        ],
                                        efficiencies: [
                                            0.97,
                                            0.97
                                        ]
                                    }
                                }
                            },
                            {
                                id: "battery-1",
                                type: "batteryNode",
                                position: {
                                    x: 300,
                                    y: 400
                                },
                                data: {
                                    label: "Battery",
                                    componentType: "battery",
                                    params: DEFAULT_PARAMS.battery
                                }
                            },
                            {
                                id: "vehicle-1",
                                type: "vehicleNode",
                                position: {
                                    x: 850,
                                    y: 250
                                },
                                data: {
                                    label: "CAT 793D",
                                    componentType: "vehicle",
                                    params: DEFAULT_PARAMS.vehicle
                                }
                            }
                        ],
                        edges: [
                            {
                                id: "e1",
                                source: "engine-1",
                                target: "planetary-1",
                                sourceHandle: "shaft",
                                targetHandle: "carrier",
                                type: "mechanical"
                            },
                            {
                                id: "e2",
                                source: "motor-1",
                                target: "planetary-1",
                                sourceHandle: "shaft-out",
                                targetHandle: "sun",
                                type: "mechanical"
                            },
                            {
                                id: "e3",
                                source: "planetary-1",
                                target: "motor-2",
                                sourceHandle: "ring",
                                targetHandle: "shaft-in",
                                type: "mechanical"
                            },
                            {
                                id: "e4",
                                source: "motor-2",
                                target: "gearbox-1",
                                sourceHandle: "shaft-out",
                                targetHandle: "input",
                                type: "mechanical"
                            },
                            {
                                id: "e5",
                                source: "gearbox-1",
                                target: "vehicle-1",
                                sourceHandle: "output",
                                targetHandle: "wheels",
                                type: "mechanical"
                            },
                            {
                                id: "e6",
                                source: "motor-1",
                                target: "battery-1",
                                sourceHandle: "electrical",
                                targetHandle: "electrical",
                                type: "electrical"
                            },
                            {
                                id: "e7",
                                source: "motor-2",
                                target: "battery-1",
                                sourceHandle: "electrical",
                                targetHandle: "electrical",
                                type: "electrical"
                            }
                        ],
                        selectedNodeId: null
                    });
                    nodeIdCounter = 8;
                    break;
                case "ecvt-locked":
                    // Similar to split but with fixed ratio instead of planetary
                    set({
                        nodes: [
                            {
                                id: "engine-1",
                                type: "engineNode",
                                position: {
                                    x: 100,
                                    y: 200
                                },
                                data: {
                                    label: "CAT 3516E",
                                    componentType: "engine",
                                    params: DEFAULT_PARAMS.engine
                                }
                            },
                            {
                                id: "motor-2",
                                type: "motorNode",
                                position: {
                                    x: 350,
                                    y: 200
                                },
                                data: {
                                    label: "MG2",
                                    componentType: "motor",
                                    params: {
                                        ...DEFAULT_PARAMS.motor,
                                        pMax: 350000,
                                        tMax: 2000,
                                        pBoost: 500000
                                    }
                                }
                            },
                            {
                                id: "gearbox-1",
                                type: "gearboxNode",
                                position: {
                                    x: 550,
                                    y: 200
                                },
                                data: {
                                    label: "2-Speed",
                                    componentType: "gearbox",
                                    params: {
                                        ratios: [
                                            5.0,
                                            0.67
                                        ],
                                        efficiencies: [
                                            0.97,
                                            0.97
                                        ]
                                    }
                                }
                            },
                            {
                                id: "battery-1",
                                type: "batteryNode",
                                position: {
                                    x: 350,
                                    y: 350
                                },
                                data: {
                                    label: "Battery",
                                    componentType: "battery",
                                    params: DEFAULT_PARAMS.battery
                                }
                            },
                            {
                                id: "vehicle-1",
                                type: "vehicleNode",
                                position: {
                                    x: 750,
                                    y: 200
                                },
                                data: {
                                    label: "CAT 793D",
                                    componentType: "vehicle",
                                    params: DEFAULT_PARAMS.vehicle
                                }
                            }
                        ],
                        edges: [
                            {
                                id: "e1",
                                source: "engine-1",
                                target: "motor-2",
                                sourceHandle: "shaft",
                                targetHandle: "shaft-in",
                                type: "mechanical"
                            },
                            {
                                id: "e2",
                                source: "motor-2",
                                target: "gearbox-1",
                                sourceHandle: "shaft-out",
                                targetHandle: "input",
                                type: "mechanical"
                            },
                            {
                                id: "e3",
                                source: "gearbox-1",
                                target: "vehicle-1",
                                sourceHandle: "output",
                                targetHandle: "wheels",
                                type: "mechanical"
                            },
                            {
                                id: "e4",
                                source: "motor-2",
                                target: "battery-1",
                                sourceHandle: "electrical",
                                targetHandle: "electrical",
                                type: "electrical"
                            }
                        ],
                        selectedNodeId: null
                    });
                    nodeIdCounter = 6;
                    break;
            }
        },
        clearAll: ()=>{
            nodeIdCounter = 1;
            set({
                nodes: [],
                edges: [],
                selectedNodeId: null
            });
        }
    }));
}),
"[project]/apps/gearbox-analyzer/lib/utils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-ssr] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
}),
"[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BaseNode",
    ()=>BaseNode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@xyflow/react/dist/esm/index.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@xyflow/system/dist/esm/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/lib/utils.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/stores/drivetrain-store.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
function BaseNode({ id, data, selected, icon, color, handles, children }) {
    const setSelectedNode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.setSelectedNode);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("relative min-w-[140px] rounded-lg border-2 bg-surface p-3 shadow-lg transition-all", selected ? "border-accent shadow-accent/20" : "border-subtle hover:border-secondary"),
        onClick: ()=>setSelectedNode(id),
        children: [
            handles.map((handle)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Handle"], {
                    id: handle.id,
                    type: handle.position === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Position"].Left || handle.position === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Position"].Top ? "target" : "source",
                    position: handle.position,
                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("!h-3 !w-3 !rounded-full !border-2 !border-dark transition-all hover:!scale-125", handle.type === "mechanical" ? "!bg-emerald-500" : "!bg-amber-500"),
                    title: handle.label
                }, handle.id, false, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx",
                    lineNumber: 42,
                    columnNumber: 9
                }, this)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2 mb-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex h-8 w-8 items-center justify-center rounded-md", color),
                        children: icon
                    }, void 0, false, {
                        fileName: "[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx",
                        lineNumber: 57,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 min-w-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-sm font-medium text-primary truncate",
                                children: data.label
                            }, void 0, false, {
                                fileName: "[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx",
                                lineNumber: 63,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xs text-muted",
                                children: data.componentType
                            }, void 0, false, {
                                fileName: "[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx",
                                lineNumber: 64,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx",
                        lineNumber: 62,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx",
                lineNumber: 56,
                columnNumber: 7
            }, this),
            children && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-2 text-xs text-secondary",
                children: children
            }, void 0, false, {
                fileName: "[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx",
                lineNumber: 69,
                columnNumber: 20
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx",
        lineNumber: 33,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/gearbox-analyzer/components/nodes/EngineNode.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EngineNode",
    ()=>EngineNode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@xyflow/system/dist/esm/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$flame$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Flame$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/flame.js [app-ssr] (ecmascript) <export default as Flame>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const handles = [
    {
        id: "shaft",
        type: "mechanical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Position"].Right,
        label: "Crankshaft"
    }
];
function EngineNode(props) {
    const { data } = props;
    const params = data.params;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BaseNode"], {
        ...props,
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$flame$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Flame$3e$__["Flame"], {
            className: "h-4 w-4 text-white"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/nodes/EngineNode.tsx",
            lineNumber: 24,
            columnNumber: 13
        }, void 0),
        color: "bg-red-600",
        handles: handles,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Power:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/EngineNode.tsx",
                            lineNumber: 30,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: [
                                ((params.pRated ?? 1800000) / 1000).toFixed(0),
                                " kW"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/EngineNode.tsx",
                            lineNumber: 31,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/EngineNode.tsx",
                    lineNumber: 29,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Torque:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/EngineNode.tsx",
                            lineNumber: 34,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: [
                                (params.tPeak ?? 11220).toLocaleString(),
                                " N·m"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/EngineNode.tsx",
                            lineNumber: 35,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/EngineNode.tsx",
                    lineNumber: 33,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "RPM:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/EngineNode.tsx",
                            lineNumber: 38,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: [
                                params.rpmIdle ?? 700,
                                " - ",
                                params.rpmMax ?? 1800
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/EngineNode.tsx",
                            lineNumber: 39,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/EngineNode.tsx",
                    lineNumber: 37,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/gearbox-analyzer/components/nodes/EngineNode.tsx",
            lineNumber: 28,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/nodes/EngineNode.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MotorNode",
    ()=>MotorNode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@xyflow/system/dist/esm/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/zap.js [app-ssr] (ecmascript) <export default as Zap>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const handles = [
    {
        id: "shaft-in",
        type: "mechanical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Position"].Left,
        label: "Shaft In"
    },
    {
        id: "shaft-out",
        type: "mechanical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Position"].Right,
        label: "Shaft Out"
    },
    {
        id: "electrical",
        type: "electrical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Position"].Bottom,
        label: "Electrical"
    }
];
function MotorNode(props) {
    const { data } = props;
    const params = data.params;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BaseNode"], {
        ...props,
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__["Zap"], {
            className: "h-4 w-4 text-white"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
            lineNumber: 27,
            columnNumber: 13
        }, void 0),
        color: "bg-blue-600",
        handles: handles,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Power:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                            lineNumber: 33,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: [
                                ((params.pMax ?? 200000) / 1000).toFixed(0),
                                " kW"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                            lineNumber: 34,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                    lineNumber: 32,
                    columnNumber: 9
                }, this),
                params.pBoost && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Boost:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                            lineNumber: 38,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-accent",
                            children: [
                                (params.pBoost / 1000).toFixed(0),
                                " kW"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                            lineNumber: 39,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                    lineNumber: 37,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Torque:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                            lineNumber: 43,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: [
                                (params.tMax ?? 3000).toLocaleString(),
                                " N·m"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                            lineNumber: 44,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                    lineNumber: 42,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Efficiency:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                            lineNumber: 47,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: [
                                ((params.eta ?? 0.92) * 100).toFixed(0),
                                "%"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                            lineNumber: 48,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                    lineNumber: 46,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
            lineNumber: 31,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
        lineNumber: 25,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/gearbox-analyzer/components/nodes/GearboxNode.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GearboxNode",
    ()=>GearboxNode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@xyflow/system/dist/esm/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-ssr] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const handles = [
    {
        id: "input",
        type: "mechanical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Position"].Left,
        label: "Input Shaft"
    },
    {
        id: "output",
        type: "mechanical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Position"].Right,
        label: "Output Shaft"
    }
];
function GearboxNode(props) {
    const { data } = props;
    const params = data.params;
    const ratios = params.ratios ?? [
        1.0
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BaseNode"], {
        ...props,
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
            className: "h-4 w-4 text-white"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/nodes/GearboxNode.tsx",
            lineNumber: 25,
            columnNumber: 13
        }, void 0),
        color: "bg-purple-600",
        handles: handles,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Gears:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/GearboxNode.tsx",
                            lineNumber: 31,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: ratios.length
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/GearboxNode.tsx",
                            lineNumber: 32,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/GearboxNode.tsx",
                    lineNumber: 30,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Ratios:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/GearboxNode.tsx",
                            lineNumber: 35,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary text-right truncate max-w-[80px]",
                            title: ratios.map((r)=>r.toFixed(2)).join(", "),
                            children: [
                                ratios[0].toFixed(2),
                                " - ",
                                ratios[ratios.length - 1].toFixed(2)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/GearboxNode.tsx",
                            lineNumber: 36,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/GearboxNode.tsx",
                    lineNumber: 34,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/gearbox-analyzer/components/nodes/GearboxNode.tsx",
            lineNumber: 29,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/nodes/GearboxNode.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/gearbox-analyzer/components/nodes/PlanetaryNode.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PlanetaryNode",
    ()=>PlanetaryNode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@xyflow/system/dist/esm/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Circle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle.js [app-ssr] (ecmascript) <export default as Circle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const handles = [
    {
        id: "sun",
        type: "mechanical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Position"].Top,
        label: "Sun Gear"
    },
    {
        id: "carrier",
        type: "mechanical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Position"].Left,
        label: "Carrier"
    },
    {
        id: "ring",
        type: "mechanical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Position"].Right,
        label: "Ring Gear"
    }
];
function PlanetaryNode(props) {
    const { data } = props;
    const params = data.params;
    const zSun = params.zSun ?? 30;
    const zRing = params.zRing ?? 90;
    const rho = zRing / zSun;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BaseNode"], {
        ...props,
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Circle$3e$__["Circle"], {
            className: "h-4 w-4 text-white"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/nodes/PlanetaryNode.tsx",
            lineNumber: 28,
            columnNumber: 13
        }, void 0),
        color: "bg-teal-600",
        handles: handles,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Sun:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/PlanetaryNode.tsx",
                            lineNumber: 34,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: [
                                zSun,
                                " teeth"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/PlanetaryNode.tsx",
                            lineNumber: 35,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/PlanetaryNode.tsx",
                    lineNumber: 33,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Ring:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/PlanetaryNode.tsx",
                            lineNumber: 38,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: [
                                zRing,
                                " teeth"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/PlanetaryNode.tsx",
                            lineNumber: 39,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/PlanetaryNode.tsx",
                    lineNumber: 37,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "ρ:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/PlanetaryNode.tsx",
                            lineNumber: 42,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: rho.toFixed(1)
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/PlanetaryNode.tsx",
                            lineNumber: 43,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/PlanetaryNode.tsx",
                    lineNumber: 41,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/gearbox-analyzer/components/nodes/PlanetaryNode.tsx",
            lineNumber: 32,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/nodes/PlanetaryNode.tsx",
        lineNumber: 26,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BatteryNode",
    ()=>BatteryNode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@xyflow/system/dist/esm/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$battery$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Battery$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/battery.js [app-ssr] (ecmascript) <export default as Battery>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const handles = [
    {
        id: "electrical",
        type: "electrical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Position"].Top,
        label: "Electrical"
    }
];
function BatteryNode(props) {
    const { data } = props;
    const params = data.params;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BaseNode"], {
        ...props,
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$battery$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Battery$3e$__["Battery"], {
            className: "h-4 w-4 text-white"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx",
            lineNumber: 25,
            columnNumber: 13
        }, void 0),
        color: "bg-amber-600",
        handles: handles,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Capacity:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx",
                            lineNumber: 31,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: [
                                params.capacityKwh ?? 200,
                                " kWh"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx",
                            lineNumber: 32,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx",
                    lineNumber: 30,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Voltage:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx",
                            lineNumber: 35,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: [
                                params.vNom ?? 700,
                                " V"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx",
                            lineNumber: 36,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx",
                    lineNumber: 34,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "P max:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx",
                            lineNumber: 39,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: [
                                ((params.pMaxDischarge ?? 1000000) / 1000).toFixed(0),
                                " kW"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx",
                            lineNumber: 40,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx",
                    lineNumber: 38,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "SOC:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx",
                            lineNumber: 43,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: [
                                ((params.socInit ?? 0.6) * 100).toFixed(0),
                                "%"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx",
                            lineNumber: 44,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx",
                    lineNumber: 42,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx",
            lineNumber: 29,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "VehicleNode",
    ()=>VehicleNode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@xyflow/system/dist/esm/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/truck.js [app-ssr] (ecmascript) <export default as Truck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const handles = [
    {
        id: "wheels",
        type: "mechanical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Position"].Left,
        label: "Wheel Input"
    }
];
function VehicleNode(props) {
    const { data } = props;
    const params = data.params;
    const mTotal = (params.mEmpty ?? 159350) + (params.mPayload ?? 190000);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BaseNode"], {
        ...props,
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__["Truck"], {
            className: "h-4 w-4 text-white"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx",
            lineNumber: 27,
            columnNumber: 13
        }, void 0),
        color: "bg-green-600",
        handles: handles,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Mass:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx",
                            lineNumber: 33,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: [
                                (mTotal / 1000).toFixed(0),
                                " t"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx",
                            lineNumber: 34,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx",
                    lineNumber: 32,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Wheel R:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx",
                            lineNumber: 37,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: [
                                params.rWheel ?? 1.78,
                                " m"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx",
                            lineNumber: 38,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx",
                    lineNumber: 36,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Rolling:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx",
                            lineNumber: 41,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: [
                                ((params.cR ?? 0.025) * 100).toFixed(1),
                                "%"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx",
                            lineNumber: 42,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx",
                    lineNumber: 40,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "V max:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx",
                            lineNumber: 45,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: [
                                ((params.vMax ?? 15) * 3.6).toFixed(0),
                                " km/h"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx",
                            lineNumber: 46,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx",
                    lineNumber: 44,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx",
            lineNumber: 31,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx",
        lineNumber: 25,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/gearbox-analyzer/components/nodes/index.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "nodeTypes",
    ()=>nodeTypes
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$EngineNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/EngineNode.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$MotorNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$GearboxNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/GearboxNode.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$PlanetaryNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/PlanetaryNode.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BatteryNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$VehicleNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx [app-ssr] (ecmascript)");
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
;
const nodeTypes = {
    engineNode: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$EngineNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EngineNode"],
    motorNode: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$MotorNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MotorNode"],
    gearboxNode: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$GearboxNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GearboxNode"],
    planetaryNode: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$PlanetaryNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlanetaryNode"],
    batteryNode: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BatteryNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BatteryNode"],
    vehicleNode: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$VehicleNode$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VehicleNode"]
};
}),
"[project]/apps/gearbox-analyzer/components/ui/card.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Card",
    ()=>Card,
    "CardContent",
    ()=>CardContent,
    "CardDescription",
    ()=>CardDescription,
    "CardFooter",
    ()=>CardFooter,
    "CardHeader",
    ()=>CardHeader,
    "CardTitle",
    ()=>CardTitle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/lib/utils.ts [app-ssr] (ecmascript)");
;
;
function Card({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-4 shadow-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/card.tsx",
        lineNumber: 6,
        columnNumber: 5
    }, this);
}
function CardHeader({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-header",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex flex-col gap-1", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/card.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
function CardTitle({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
        "data-slot": "card-title",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("text-lg font-semibold leading-none", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/card.tsx",
        lineNumber: 29,
        columnNumber: 5
    }, this);
}
function CardDescription({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        "data-slot": "card-description",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("text-muted-foreground text-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/card.tsx",
        lineNumber: 39,
        columnNumber: 5
    }, this);
}
function CardContent({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-content",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/card.tsx",
        lineNumber: 49,
        columnNumber: 5
    }, this);
}
function CardFooter({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-footer",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex items-center gap-2", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/card.tsx",
        lineNumber: 55,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/apps/gearbox-analyzer/components/ui/button.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/lib/utils.ts [app-ssr] (ecmascript)");
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground hover:bg-primary/90",
            destructive: "bg-destructive text-white hover:bg-destructive/90",
            outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
            link: "text-primary underline-offset-4 hover:underline",
            accent: "bg-accent text-accent-foreground hover:bg-accent-hover"
        },
        size: {
            default: "h-9 px-4 py-2 has-[>svg]:px-3",
            sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
            lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
            icon: "size-9",
            "icon-sm": "size-8",
            "icon-lg": "size-10"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
function Button({ className, variant, size, asChild = false, ...props }) {
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Slot"] : "button";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        "data-slot": "button",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/button.tsx",
        lineNumber: 48,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ComponentPalette",
    ()=>ComponentPalette
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$flame$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Flame$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/flame.js [app-ssr] (ecmascript) <export default as Flame>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/zap.js [app-ssr] (ecmascript) <export default as Zap>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-ssr] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Circle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle.js [app-ssr] (ecmascript) <export default as Circle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$battery$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Battery$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/battery.js [app-ssr] (ecmascript) <export default as Battery>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/truck.js [app-ssr] (ecmascript) <export default as Truck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/card.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/stores/drivetrain-store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/lib/utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
const COMPONENT_ITEMS = [
    {
        type: "engine",
        label: "Engine",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$flame$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Flame$3e$__["Flame"], {
            className: "h-4 w-4"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
            lineNumber: 15,
            columnNumber: 44
        }, ("TURBOPACK compile-time value", void 0)),
        color: "bg-red-600"
    },
    {
        type: "motor",
        label: "Motor",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__["Zap"], {
            className: "h-4 w-4"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
            lineNumber: 16,
            columnNumber: 42
        }, ("TURBOPACK compile-time value", void 0)),
        color: "bg-blue-600"
    },
    {
        type: "gearbox",
        label: "Gearbox",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
            className: "h-4 w-4"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
            lineNumber: 17,
            columnNumber: 46
        }, ("TURBOPACK compile-time value", void 0)),
        color: "bg-purple-600"
    },
    {
        type: "planetary",
        label: "Planetary",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Circle$3e$__["Circle"], {
            className: "h-4 w-4"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
            lineNumber: 18,
            columnNumber: 50
        }, ("TURBOPACK compile-time value", void 0)),
        color: "bg-teal-600"
    },
    {
        type: "battery",
        label: "Battery",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$battery$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Battery$3e$__["Battery"], {
            className: "h-4 w-4"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
            lineNumber: 19,
            columnNumber: 46
        }, ("TURBOPACK compile-time value", void 0)),
        color: "bg-amber-600"
    },
    {
        type: "vehicle",
        label: "Vehicle",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__["Truck"], {
            className: "h-4 w-4"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
            lineNumber: 20,
            columnNumber: 46
        }, ("TURBOPACK compile-time value", void 0)),
        color: "bg-green-600"
    }
];
const PRESETS = [
    {
        name: "diesel-793d",
        label: "CAT 793D Diesel"
    },
    {
        name: "ecvt-split",
        label: "eCVT Power Split"
    },
    {
        name: "ecvt-locked",
        label: "eCVT Locked Sun"
    }
];
function ComponentPalette() {
    const addNode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.addNode);
    const loadPreset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.loadPreset);
    const clearAll = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.clearAll);
    const handleDragStart = (e, type)=>{
        e.dataTransfer.setData("application/reactflow", type);
        e.dataTransfer.effectAllowed = "move";
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-64 flex flex-col gap-4 p-4 bg-dark border-r border-subtle overflow-y-auto",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Card"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CardHeader"], {
                        className: "pb-2",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CardTitle"], {
                            className: "text-sm",
                            children: "Components"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
                            lineNumber: 43,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
                        lineNumber: 42,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CardContent"], {
                        className: "grid grid-cols-2 gap-2",
                        children: COMPONENT_ITEMS.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                draggable: true,
                                onDragStart: (e)=>handleDragStart(e, item.type),
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex flex-col items-center gap-1 p-2 rounded-lg border border-subtle cursor-grab", "hover:border-secondary hover:bg-surface/50 transition-all"),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("p-2 rounded-md text-white", item.color),
                                        children: item.icon
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
                                        lineNumber: 56,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-secondary",
                                        children: item.label
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
                                        lineNumber: 59,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, item.type, true, {
                                fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
                                lineNumber: 47,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
                        lineNumber: 45,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
                lineNumber: 41,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Card"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CardHeader"], {
                        className: "pb-2",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CardTitle"], {
                            className: "text-sm",
                            children: "Presets"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
                            lineNumber: 67,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
                        lineNumber: 66,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CardContent"], {
                        className: "flex flex-col gap-2",
                        children: [
                            PRESETS.map((preset)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "outline",
                                    size: "sm",
                                    className: "justify-start",
                                    onClick: ()=>loadPreset(preset.name),
                                    children: preset.label
                                }, preset.name, false, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
                                    lineNumber: 71,
                                    columnNumber: 13
                                }, this)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                variant: "ghost",
                                size: "sm",
                                className: "justify-start text-destructive hover:text-destructive",
                                onClick: clearAll,
                                children: "Clear All"
                            }, void 0, false, {
                                fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
                                lineNumber: 81,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
                        lineNumber: 69,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
                lineNumber: 65,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
        lineNumber: 40,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/gearbox-analyzer/components/ui/input.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Input",
    ()=>Input
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/lib/utils.ts [app-ssr] (ecmascript)");
;
;
function Input({ className, type, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        type: type,
        "data-slot": "input",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("placeholder:text-muted-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50", "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/input.tsx",
        lineNumber: 6,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/apps/gearbox-analyzer/components/ui/label.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Label",
    ()=>Label
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$label$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-label/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/lib/utils.ts [app-ssr] (ecmascript)");
;
;
;
function Label({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$label$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"], {
        "data-slot": "label",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/label.tsx",
        lineNumber: 10,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/apps/gearbox-analyzer/components/ui/separator.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Separator",
    ()=>Separator
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$separator$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-separator/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/lib/utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function Separator({ className, orientation = "horizontal", decorative = true, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$separator$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"], {
        "data-slot": "separator",
        decorative: decorative,
        orientation: orientation,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("bg-border shrink-0", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/separator.tsx",
        lineNumber: 14,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PropertiesPanel",
    ()=>PropertiesPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/card.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/input.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/label.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$separator$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/separator.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-ssr] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/stores/drivetrain-store.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
// Parameter definitions for each component type
const PARAM_DEFS = {
    engine: [
        {
            key: "rpmIdle",
            label: "Idle RPM",
            unit: "rpm"
        },
        {
            key: "rpmMax",
            label: "Max RPM",
            unit: "rpm"
        },
        {
            key: "pRated",
            label: "Rated Power",
            unit: "W"
        },
        {
            key: "tPeak",
            label: "Peak Torque",
            unit: "N·m"
        }
    ],
    motor: [
        {
            key: "pMax",
            label: "Max Power",
            unit: "W"
        },
        {
            key: "pBoost",
            label: "Boost Power",
            unit: "W"
        },
        {
            key: "tMax",
            label: "Max Torque",
            unit: "N·m"
        },
        {
            key: "rpmMax",
            label: "Max RPM",
            unit: "rpm"
        },
        {
            key: "eta",
            label: "Efficiency",
            step: 0.01
        }
    ],
    gearbox: [
        {
            key: "ratios",
            label: "Ratios (comma-sep)"
        }
    ],
    planetary: [
        {
            key: "zSun",
            label: "Sun Teeth"
        },
        {
            key: "zRing",
            label: "Ring Teeth"
        }
    ],
    battery: [
        {
            key: "capacityKwh",
            label: "Capacity",
            unit: "kWh"
        },
        {
            key: "vNom",
            label: "Voltage",
            unit: "V"
        },
        {
            key: "pMaxDischarge",
            label: "Max Discharge",
            unit: "W"
        },
        {
            key: "pMaxCharge",
            label: "Max Charge",
            unit: "W"
        },
        {
            key: "socInit",
            label: "Initial SOC",
            step: 0.01
        }
    ],
    vehicle: [
        {
            key: "mEmpty",
            label: "Empty Mass",
            unit: "kg"
        },
        {
            key: "mPayload",
            label: "Payload",
            unit: "kg"
        },
        {
            key: "rWheel",
            label: "Wheel Radius",
            unit: "m",
            step: 0.01
        },
        {
            key: "cR",
            label: "Rolling Coeff",
            step: 0.001
        },
        {
            key: "vMax",
            label: "Max Speed",
            unit: "m/s"
        }
    ]
};
function PropertiesPanel() {
    const nodes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.nodes);
    const selectedNodeId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.selectedNodeId);
    const updateNodeParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.updateNodeParams);
    const removeNode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.removeNode);
    const setSelectedNode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.setSelectedNode);
    const selectedNode = nodes.find((n)=>n.id === selectedNodeId);
    if (!selectedNode) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-72 p-4 bg-dark border-l border-subtle",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Card"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CardContent"], {
                    className: "py-8 text-center text-muted",
                    children: "Select a component to edit its properties"
                }, void 0, false, {
                    fileName: "[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx",
                    lineNumber: 65,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx",
                lineNumber: 64,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx",
            lineNumber: 63,
            columnNumber: 7
        }, this);
    }
    const componentType = selectedNode.data.componentType;
    const params = selectedNode.data.params;
    const paramDefs = PARAM_DEFS[componentType] ?? [];
    const handleChange = (key, value)=>{
        let parsedValue = value;
        // Special handling for ratios array
        if (key === "ratios") {
            parsedValue = value.split(",").map((v)=>parseFloat(v.trim())).filter((v)=>!isNaN(v));
        } else {
            const num = parseFloat(value);
            if (!isNaN(num)) {
                parsedValue = num;
            }
        }
        updateNodeParams(selectedNode.id, {
            [key]: parsedValue
        });
    };
    const handleDelete = ()=>{
        removeNode(selectedNode.id);
        setSelectedNode(null);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-72 flex flex-col gap-4 p-4 bg-dark border-l border-subtle overflow-y-auto",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Card"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CardHeader"], {
                    className: "pb-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CardTitle"], {
                            className: "text-sm flex items-center justify-between",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: selectedNode.data.label
                                }, void 0, false, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx",
                                    lineNumber: 103,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "ghost",
                                    size: "icon-sm",
                                    className: "text-destructive hover:text-destructive hover:bg-destructive/10",
                                    onClick: handleDelete,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                        className: "h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx",
                                        lineNumber: 110,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx",
                                    lineNumber: 104,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx",
                            lineNumber: 102,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-muted capitalize",
                            children: componentType
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx",
                            lineNumber: 113,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx",
                    lineNumber: 101,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CardContent"], {
                    className: "space-y-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$separator$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Separator"], {}, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx",
                            lineNumber: 116,
                            columnNumber: 11
                        }, this),
                        paramDefs.map((def)=>{
                            const value = params[def.key];
                            const displayValue = Array.isArray(value) ? value.join(", ") : String(value ?? "");
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Label"], {
                                        htmlFor: def.key,
                                        className: "text-xs",
                                        children: [
                                            def.label,
                                            def.unit && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-muted ml-1",
                                                children: [
                                                    "(",
                                                    def.unit,
                                                    ")"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx",
                                                lineNumber: 127,
                                                columnNumber: 32
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx",
                                        lineNumber: 125,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                        id: def.key,
                                        value: displayValue,
                                        onChange: (e)=>handleChange(def.key, e.target.value),
                                        step: def.step,
                                        className: "h-8 text-sm"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx",
                                        lineNumber: 129,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, def.key, true, {
                                fileName: "[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx",
                                lineNumber: 124,
                                columnNumber: 15
                            }, this);
                        })
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx",
                    lineNumber: 115,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx",
            lineNumber: 100,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx",
        lineNumber: 99,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/gearbox-analyzer/components/ui/tabs.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Tabs",
    ()=>Tabs,
    "TabsContent",
    ()=>TabsContent,
    "TabsList",
    ()=>TabsList,
    "TabsTrigger",
    ()=>TabsTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tabs$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-tabs/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/lib/utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function Tabs({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tabs$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"], {
        "data-slot": "tabs",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex flex-col gap-2", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/tabs.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
}
function TabsList({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tabs$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["List"], {
        "data-slot": "tabs-list",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("bg-muted/30 text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-1", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/tabs.tsx",
        lineNumber: 25,
        columnNumber: 5
    }, this);
}
function TabsTrigger({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tabs$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Trigger"], {
        "data-slot": "tabs-trigger",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all", "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm", "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/tabs.tsx",
        lineNumber: 41,
        columnNumber: 5
    }, this);
}
function TabsContent({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tabs$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Content"], {
        "data-slot": "tabs-content",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/tabs.tsx",
        lineNumber: 59,
        columnNumber: 5
    }, this);
}
;
}),
"[project]/apps/gearbox-analyzer/stores/simulation-store.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PRESET_COLORS",
    ()=>PRESET_COLORS,
    "PRESET_LABELS",
    ()=>PRESET_LABELS,
    "useSimulationStore",
    ()=>useSimulationStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-ssr] (ecmascript)");
"use client";
;
const DEFAULT_CONFIG = {
    tEnd: 60,
    dtOutput: 0.1,
    targetVelocity: 12,
    grade: 0.0,
    payloadFraction: 1.0
};
const PRESET_COLORS = {
    "diesel-793d": "#ef4444",
    "ecvt-split": "#3b82f6",
    "ecvt-locked": "#22c55e"
};
const PRESET_LABELS = {
    "diesel-793d": "Diesel 7-Speed",
    "ecvt-split": "eCVT Power-Split",
    "ecvt-locked": "eCVT Locked-Sun"
};
const useSimulationStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["create"])((set)=>({
        config: DEFAULT_CONFIG,
        status: "idle",
        progress: 0,
        error: null,
        result: null,
        rimpullCurves: [],
        // Comparison mode
        comparisonMode: false,
        comparisonResults: [],
        runningPreset: null,
        setConfig: (config)=>set((state)=>({
                    config: {
                        ...state.config,
                        ...config
                    }
                })),
        setStatus: (status)=>set({
                status
            }),
        setProgress: (progress)=>set({
                progress
            }),
        setError: (error)=>set({
                error,
                status: error ? "error" : "idle"
            }),
        setResult: (result)=>set({
                result,
                status: result ? "completed" : "idle"
            }),
        setRimpullCurves: (curves)=>set({
                rimpullCurves: curves
            }),
        reset: ()=>set({
                status: "idle",
                progress: 0,
                error: null,
                result: null
            }),
        // Comparison actions
        setComparisonMode: (enabled)=>set({
                comparisonMode: enabled
            }),
        addComparisonResult: (result)=>set((state)=>({
                    comparisonResults: [
                        ...state.comparisonResults.filter((r)=>r.preset !== result.preset),
                        result
                    ]
                })),
        clearComparisonResults: ()=>set({
                comparisonResults: []
            }),
        setRunningPreset: (preset)=>set({
                runningPreset: preset
            })
    }));
}),
"[project]/packages/drivetrain-sim/src/core/ports.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Port types and connection definitions for drivetrain components.
 */ __turbopack_context__.s([
    "PortDirection",
    ()=>PortDirection,
    "PortType",
    ()=>PortType,
    "canConnect",
    ()=>canConnect,
    "electricalPort",
    ()=>electricalPort,
    "mechanicalPort",
    ()=>mechanicalPort
]);
var PortType = /*#__PURE__*/ function(PortType) {
    /** Rotating shaft: (omega [rad/s], torque [N*m]) */ PortType["MECHANICAL"] = "MECHANICAL";
    /** Power bus: (voltage [V], current [A]) */ PortType["ELECTRICAL"] = "ELECTRICAL";
    return PortType;
}({});
var PortDirection = /*#__PURE__*/ function(PortDirection) {
    PortDirection["INPUT"] = "INPUT";
    PortDirection["OUTPUT"] = "OUTPUT";
    PortDirection["BIDIRECTIONAL"] = "BIDIRECTIONAL";
    return PortDirection;
}({});
function mechanicalPort(name, direction, description) {
    return {
        name,
        portType: "MECHANICAL",
        direction,
        description
    };
}
function electricalPort(name, direction, description) {
    return {
        name,
        portType: "ELECTRICAL",
        direction,
        description
    };
}
function canConnect(portA, portB) {
    // Must be same type
    if (portA.portType !== portB.portType) {
        return false;
    }
    // Check direction compatibility
    if (portA.direction === "BIDIRECTIONAL" || portB.direction === "BIDIRECTIONAL") {
        return true;
    }
    // OUTPUT can connect to INPUT
    return portA.direction === "OUTPUT" && portB.direction === "INPUT" || portA.direction === "INPUT" && portB.direction === "OUTPUT";
}
}),
"[project]/packages/drivetrain-sim/src/core/component.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Base class for all drivetrain components.
 */ __turbopack_context__.s([
    "DrivetrainComponent",
    ()=>DrivetrainComponent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/ports.ts [app-ssr] (ecmascript)");
;
class DrivetrainComponent {
    _name;
    constructor(name = 'component'){
        this._name = name;
    }
    get name() {
        return this._name;
    }
    set name(value) {
        this._name = value;
    }
    /** Get a port by name. */ getPort(name) {
        return this.ports[name];
    }
    /** Check if a port exists. */ hasPort(name) {
        return name in this.ports;
    }
    /** Get all mechanical ports. */ getMechanicalPorts() {
        const result = {};
        for (const [name, port] of Object.entries(this.ports)){
            if (port.portType === __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortType"].MECHANICAL) {
                result[name] = port;
            }
        }
        return result;
    }
    /** Get all electrical ports. */ getElectricalPorts() {
        const result = {};
        for (const [name, port] of Object.entries(this.ports)){
            if (port.portType === __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortType"].ELECTRICAL) {
                result[name] = port;
            }
        }
        return result;
    }
    /** Get total inertia across all mechanical ports. */ getTotalInertia() {
        let total = 0;
        for (const portName of Object.keys(this.getMechanicalPorts())){
            total += this.getInertia(portName);
        }
        return total;
    }
    /** Validate component configuration. Returns list of error messages. */ validate() {
        const errors = [];
        // Check that all ports have valid types
        for (const [name, port] of Object.entries(this.ports)){
            if (!port.portType) {
                errors.push(`Port '${name}' has no type`);
            }
        }
        return errors;
    }
}
}),
"[project]/packages/drivetrain-sim/src/core/constraints.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Kinematic constraints that relate speeds and torques between ports.
 */ /**
 * Speed relation: sum(coeff_i * omega_i) = 0
 * Maps port names to coefficients.
 */ __turbopack_context__.s([
    "GearRatioConstraint",
    ()=>GearRatioConstraint,
    "RigidConnectionConstraint",
    ()=>RigidConnectionConstraint,
    "WillisConstraint",
    ()=>WillisConstraint
]);
class GearRatioConstraint {
    inputPort;
    outputPort;
    ratio;
    efficiency;
    constructor(config){
        this.inputPort = config.inputPort;
        this.outputPort = config.outputPort;
        this.ratio = config.ratio;
        this.efficiency = config.efficiency ?? 1.0;
    }
    getSpeedRelation() {
        // omega_in - ratio * omega_out = 0
        return {
            [this.inputPort]: 1.0,
            [this.outputPort]: -this.ratio
        };
    }
    getDependentPort() {
        return this.outputPort;
    }
    getIndependentPorts() {
        return [
            this.inputPort
        ];
    }
    /** Transform input speed to output speed. */ transformSpeed(omegaIn) {
        return omegaIn / this.ratio;
    }
    /** Transform output torque to input torque (back-propagation). */ transformTorque(torqueOut) {
        return torqueOut / (this.ratio * this.efficiency);
    }
    /** Get inertia reflected through the gear ratio. */ getReflectedInertia(jOutput) {
        return jOutput / (this.ratio * this.ratio);
    }
}
class WillisConstraint {
    sunPort;
    carrierPort;
    ringPort;
    rho;
    constructor(config){
        this.sunPort = config.sunPort;
        this.carrierPort = config.carrierPort;
        this.ringPort = config.ringPort;
        this.rho = config.rho;
    }
    getSpeedRelation() {
        // omega_sun - (1+rho)*omega_carrier + rho*omega_ring = 0
        return {
            [this.sunPort]: 1.0,
            [this.carrierPort]: -(1 + this.rho),
            [this.ringPort]: this.rho
        };
    }
    getDependentPort() {
        // Sun is typically eliminated (connected to MG1)
        return this.sunPort;
    }
    getIndependentPorts() {
        return [
            this.carrierPort,
            this.ringPort
        ];
    }
    /** Calculate sun speed from carrier and ring speeds. */ calcSunSpeed(omegaCarrier, omegaRing) {
        return (1 + this.rho) * omegaCarrier - this.rho * omegaRing;
    }
    /** Calculate carrier speed from sun and ring speeds. */ calcCarrierSpeed(omegaSun, omegaRing) {
        return (omegaSun + this.rho * omegaRing) / (1 + this.rho);
    }
    /** Calculate ring speed from carrier and sun speeds. */ calcRingSpeed(omegaCarrier, omegaSun) {
        return ((1 + this.rho) * omegaCarrier - omegaSun) / this.rho;
    }
    /**
   * Get torque ratios: [sun, carrier, ring]
   *
   * T_sun : T_carrier : T_ring = 1 : -(1+rho) : rho
   *
   * If sun torque is T_s, then:
   * - Carrier torque = -(1+rho) * T_s
   * - Ring torque = rho * T_s
   */ getTorqueRatios() {
        return [
            1.0,
            -(1 + this.rho),
            this.rho
        ];
    }
    /**
   * Get inertia coupling coefficients for 2-DOF system (carrier, ring).
   *
   * With sun eliminated, the coupled inertia matrix from sun's inertia J_sun is:
   * J_cc = (1+rho)^2 * J_sun
   * J_cr = -(1+rho) * rho * J_sun  (off-diagonal)
   * J_rr = rho^2 * J_sun
   */ getInertiaCoefficients() {
        const onePlusRho = 1 + this.rho;
        return {
            carrierCarrier: onePlusRho * onePlusRho,
            carrierRing: -onePlusRho * this.rho,
            ringRing: this.rho * this.rho
        };
    }
}
class RigidConnectionConstraint {
    portA;
    portB;
    constructor(portA, portB){
        this.portA = portA;
        this.portB = portB;
    }
    getSpeedRelation() {
        // omega_a - omega_b = 0
        return {
            [this.portA]: 1.0,
            [this.portB]: -1.0
        };
    }
    getDependentPort() {
        return this.portB;
    }
    getIndependentPorts() {
        return [
            this.portA
        ];
    }
}
}),
"[project]/packages/drivetrain-sim/src/math/linalg.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Minimal linear algebra utilities for drivetrain simulation.
 */ /**
 * Solve Ax = b using Gaussian elimination with partial pivoting.
 *
 * For small matrices (< 10x10 for drivetrain systems), this is efficient enough.
 *
 * @param A - Coefficient matrix (n x n)
 * @param b - Right-hand side vector (n)
 * @returns Solution vector x (n)
 * @throws Error if matrix is singular
 */ __turbopack_context__.s([
    "addVectors",
    ()=>addVectors,
    "copyMatrix",
    ()=>copyMatrix,
    "dot",
    ()=>dot,
    "eye",
    ()=>eye,
    "matVecMul",
    ()=>matVecMul,
    "scaleVector",
    ()=>scaleVector,
    "solveLinear",
    ()=>solveLinear,
    "subtractVectors",
    ()=>subtractVectors,
    "zeros",
    ()=>zeros
]);
function solveLinear(A, b) {
    const n = A.length;
    if (n === 0) {
        return [];
    }
    // Create augmented matrix [A | b]
    const aug = A.map((row, i)=>[
            ...row,
            b[i]
        ]);
    // Forward elimination with partial pivoting
    for(let k = 0; k < n; k++){
        // Find pivot (largest absolute value in column k)
        let maxIdx = k;
        let maxVal = Math.abs(aug[k][k]);
        for(let i = k + 1; i < n; i++){
            const absVal = Math.abs(aug[i][k]);
            if (absVal > maxVal) {
                maxVal = absVal;
                maxIdx = i;
            }
        }
        // Swap rows if needed
        if (maxIdx !== k) {
            [aug[k], aug[maxIdx]] = [
                aug[maxIdx],
                aug[k]
            ];
        }
        // Check for singularity
        const pivot = aug[k][k];
        if (Math.abs(pivot) < 1e-15) {
            throw new Error('Singular matrix in solveLinear');
        }
        // Eliminate column k below pivot
        for(let i = k + 1; i < n; i++){
            const factor = aug[i][k] / pivot;
            for(let j = k; j <= n; j++){
                aug[i][j] -= factor * aug[k][j];
            }
        }
    }
    // Back substitution
    const x = new Array(n).fill(0);
    for(let i = n - 1; i >= 0; i--){
        let sum = aug[i][n];
        for(let j = i + 1; j < n; j++){
            sum -= aug[i][j] * x[j];
        }
        x[i] = sum / aug[i][i];
    }
    return x;
}
function matVecMul(A, x) {
    return A.map((row)=>row.reduce((sum, val, j)=>sum + val * x[j], 0));
}
function zeros(n, m) {
    return Array.from({
        length: n
    }, ()=>new Array(m).fill(0));
}
function eye(n) {
    const I = zeros(n, n);
    for(let i = 0; i < n; i++){
        I[i][i] = 1;
    }
    return I;
}
function addVectors(a, b) {
    return a.map((val, i)=>val + b[i]);
}
function subtractVectors(a, b) {
    return a.map((val, i)=>val - b[i]);
}
function scaleVector(scalar, a) {
    return a.map((val)=>scalar * val);
}
function dot(a, b) {
    return a.reduce((sum, val, i)=>sum + val * b[i], 0);
}
function copyMatrix(A) {
    return A.map((row)=>[
            ...row
        ]);
}
}),
"[project]/packages/drivetrain-sim/src/core/drivetrain.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Compiled drivetrain with automatically-derived dynamics.
 */ __turbopack_context__.s([
    "Drivetrain",
    ()=>Drivetrain
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$constraints$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/constraints.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/ports.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$math$2f$linalg$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/math/linalg.ts [app-ssr] (ecmascript)");
;
;
;
class Drivetrain {
    topology;
    _components;
    _allDofs = [];
    _independentDofs = [];
    _eliminatedDofs = new Map();
    _internalStates = [];
    _controlInputs = [];
    _inertiaMatrix = null;
    _gearState = new Map();
    constructor(topology){
        this.topology = topology;
        this._components = topology.components;
        this._compile();
    }
    _compile() {
        this._identifyDofs();
        this._applyConstraints();
        this._collectInternalStates();
        this._identifyControlInputs();
        this._buildInertiaMatrix();
    }
    _identifyDofs() {
        const allDofs = [];
        let idx = 0;
        for (const [compName, component] of this._components){
            for (const portName of Object.keys(component.getMechanicalPorts())){
                const dofName = `${compName}.${portName}`;
                allDofs.push({
                    name: dofName,
                    component: compName,
                    port: portName,
                    index: idx
                });
                idx++;
            }
        }
        this._allDofs = allDofs;
    }
    _applyConstraints() {
        // Start with all DOFs as independent
        const independent = new Map();
        for (const dof of this._allDofs){
            independent.set(dof.name, dof);
        }
        const eliminated = new Map();
        // First, handle connections between components (speed equality constraints)
        for (const conn of this.topology.connections){
            const fromDof = `${conn.fromComponent}.${conn.fromPort}`;
            const toDof = `${conn.toComponent}.${conn.toPort}`;
            // Check port types
            const fromPort = this._components.get(conn.fromComponent).getPort(conn.fromPort);
            if (fromPort?.portType !== __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortType"].MECHANICAL) {
                continue; // Skip electrical connections
            }
            // The "to" port takes on the "from" port's speed
            if (independent.has(toDof)) {
                independent.delete(toDof);
                eliminated.set(toDof, {
                    constraint: new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$constraints$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RigidConnectionConstraint"](fromDof, toDof),
                    component: 'connection',
                    eliminatedDof: toDof,
                    expression: {
                        [fromDof]: 1.0
                    }
                });
            }
        }
        // Then, handle component internal constraints
        for (const [compName, component] of this._components){
            for (const constraint of component.getConstraints()){
                const dependentPort = constraint.getDependentPort();
                const dependentDof = `${compName}.${dependentPort}`;
                // Build expression for the dependent DOF
                const expression = {};
                const relation = constraint.getSpeedRelation();
                // Find the coefficient for the dependent DOF
                const depCoeff = relation[dependentPort] ?? 0;
                if (Math.abs(depCoeff) < 1e-12) {
                    continue; // Can't eliminate this DOF
                }
                // Express dependent DOF in terms of others
                for (const [portName, coeff] of Object.entries(relation)){
                    if (portName === dependentPort) {
                        continue;
                    }
                    const fullName = `${compName}.${portName}`;
                    // Resolve through any previous eliminations
                    const resolved = this._resolveDof(fullName, independent, eliminated);
                    for (const [dofName, factor] of Object.entries(resolved)){
                        const current = expression[dofName] ?? 0;
                        expression[dofName] = current - coeff / depCoeff * factor;
                    }
                }
                // If dependent DOF is already eliminated, follow the chain
                if (!independent.has(dependentDof)) {
                    if (eliminated.has(dependentDof)) {
                        const connInfo = eliminated.get(dependentDof);
                        // Only handle 1:1 connections (rigid connections)
                        const exprKeys = Object.keys(connInfo.expression);
                        if (exprKeys.length === 1) {
                            const connectedDof = exprKeys[0];
                            const coeffConnection = connInfo.expression[connectedDof];
                            if (Math.abs(coeffConnection - 1.0) < 1e-12 && independent.has(connectedDof)) {
                                // Eliminate the connected DOF with the constraint expression
                                independent.delete(connectedDof);
                                eliminated.set(connectedDof, {
                                    constraint,
                                    component: compName,
                                    eliminatedDof: connectedDof,
                                    expression
                                });
                            }
                        }
                    }
                    continue;
                }
                independent.delete(dependentDof);
                eliminated.set(dependentDof, {
                    constraint,
                    component: compName,
                    eliminatedDof: dependentDof,
                    expression
                });
            }
        }
        // Re-index remaining independent DOFs
        this._independentDofs = [];
        let idx = 0;
        for (const [name, dofInfo] of independent){
            this._independentDofs.push({
                name,
                component: dofInfo.component,
                port: dofInfo.port,
                index: idx
            });
            idx++;
        }
        this._eliminatedDofs = eliminated;
    }
    _resolveDof(dofName, independent, eliminated) {
        if (independent.has(dofName)) {
            return {
                [dofName]: 1.0
            };
        }
        if (eliminated.has(dofName)) {
            const info = eliminated.get(dofName);
            const result = {};
            for (const [subDof, coeff] of Object.entries(info.expression)){
                const subResolved = this._resolveDof(subDof, independent, eliminated);
                for (const [finalDof, finalCoeff] of Object.entries(subResolved)){
                    const current = result[finalDof] ?? 0;
                    result[finalDof] = current + coeff * finalCoeff;
                }
            }
            return result;
        }
        // DOF not found
        throw new Error(`DOF '${dofName}' not found in topology`);
    }
    _collectInternalStates() {
        this._internalStates = [];
        for (const [compName, component] of this._components){
            for (const stateName of component.stateNames){
                this._internalStates.push([
                    compName,
                    stateName
                ]);
            }
        }
    }
    _identifyControlInputs() {
        this._controlInputs = [];
        for (const [compName, component] of this._components){
            const compType = component.constructor.name;
            if (compType.includes('Engine')) {
                this._controlInputs.push(`T_${compName}`);
            } else if (compType.includes('Motor')) {
                this._controlInputs.push(`T_${compName}`);
            }
        }
        // Add gear selection for gearboxes
        for (const [compName, component] of this._components){
            const compType = component.constructor.name;
            if (compType.includes('Gearbox')) {
                this._controlInputs.push(`gear_${compName}`);
                this._gearState.set(compName, 0);
            }
        }
    }
    _buildInertiaMatrix() {
        const nDof = this._independentDofs.length;
        const J = [];
        for(let i = 0; i < nDof; i++){
            J.push(new Array(nDof).fill(0));
        }
        for(let i = 0; i < nDof; i++){
            for(let j = 0; j < nDof; j++){
                J[i][j] = this._computeCoupledInertia(this._independentDofs[i], this._independentDofs[j]);
            }
        }
        this._inertiaMatrix = J;
    }
    _computeCoupledInertia(dofI, dofJ) {
        let total = 0;
        const contributionsI = this._getInertiaContributions(dofI.name);
        const contributionsJ = this._getInertiaContributions(dofJ.name);
        for (const [key, coeffI] of contributionsI){
            const coeffJ = contributionsJ.get(key) ?? 0;
            if (Math.abs(coeffJ) > 1e-12) {
                const [comp, port] = key.split(':');
                const jPort = this._components.get(comp).getInertia(port);
                total += jPort * coeffI * coeffJ;
            }
        }
        return total;
    }
    _getInertiaContributions(dofName) {
        const contributions = new Map();
        // The DOF's own port
        for (const dof of this._independentDofs){
            if (dof.name === dofName) {
                contributions.set(`${dof.component}:${dof.port}`, 1.0);
            }
        }
        // Build resolved expressions for all eliminated DOFs
        const independentMap = new Map();
        for (const dof of this._independentDofs){
            independentMap.set(dof.name, dof);
        }
        const resolvedExpressions = new Map();
        for (const [elimName] of this._eliminatedDofs){
            const resolved = this._resolveDof(elimName, independentMap, this._eliminatedDofs);
            resolvedExpressions.set(elimName, resolved);
        }
        // Add contributions from eliminated DOFs that depend on dofName
        for (const [elimName, resolved] of resolvedExpressions){
            const coeff = resolved[dofName] ?? 0;
            if (Math.abs(coeff) > 1e-12) {
                const parts = elimName.split('.');
                contributions.set(`${parts[0]}:${parts[1]}`, coeff);
            }
        }
        return contributions;
    }
    /** Names of all state variables. */ get stateNames() {
        const names = this._independentDofs.map((dof)=>dof.name);
        for (const [comp, state] of this._internalStates){
            names.push(`${comp}.${state}`);
        }
        return names;
    }
    /** Number of mechanical degrees of freedom. */ get nMechanicalDofs() {
        return this._independentDofs.length;
    }
    /** Number of internal state variables. */ get nInternalStates() {
        return this._internalStates.length;
    }
    /** Total number of state variables. */ get nStates() {
        return this.nMechanicalDofs + this.nInternalStates;
    }
    /** Names of control inputs. */ get controlNames() {
        return this._controlInputs;
    }
    /** The compiled inertia matrix. */ get inertiaMatrix() {
        if (this._inertiaMatrix === null) {
            this._buildInertiaMatrix();
        }
        return this._inertiaMatrix;
    }
    /** Get a component by name. */ getComponent(name) {
        return this._components.get(name);
    }
    /** Set the current gear for a gearbox component. */ setGear(component, gear) {
        if (this._gearState.has(component)) {
            this._gearState.set(component, gear);
            // Rebuild since ratios changed
            this._applyConstraints();
            this._buildInertiaMatrix();
        }
    }
    /** Convert state dict to array. */ stateToArray(state) {
        const x = new Array(this.nStates).fill(0);
        for(let i = 0; i < this.stateNames.length; i++){
            x[i] = state[this.stateNames[i]] ?? 0;
        }
        return x;
    }
    /** Convert state array to dict. */ arrayToState(x) {
        const result = {};
        for(let i = 0; i < this.stateNames.length; i++){
            result[this.stateNames[i]] = x[i];
        }
        return result;
    }
    /**
   * Compute all port speeds from state vector.
   *
   * Returns speeds for both independent and constrained DOFs.
   */ getAllSpeeds(x) {
        const state = this.arrayToState(x);
        const speeds = {};
        // Independent DOFs have speeds directly in state
        for (const dof of this._independentDofs){
            speeds[dof.name] = state[dof.name] ?? 0;
        }
        // Constrained DOFs computed from constraints (with recursive resolution)
        const resolveSpeed = (dofName)=>{
            if (speeds[dofName] !== undefined) {
                return speeds[dofName];
            }
            if (this._eliminatedDofs.has(dofName)) {
                const info = this._eliminatedDofs.get(dofName);
                let omega = 0;
                for (const [depName, coeff] of Object.entries(info.expression)){
                    omega += coeff * resolveSpeed(depName);
                }
                speeds[dofName] = omega;
                return omega;
            }
            return 0;
        };
        for (const elimName of this._eliminatedDofs.keys()){
            resolveSpeed(elimName);
        }
        return speeds;
    }
    /**
   * Compute state derivatives for ODE integration.
   *
   * @param t - Current time [s]
   * @param x - State vector [omega_1, ..., omega_n, state_1, ..., state_m]
   * @param control - Control inputs (torques, gear selections)
   * @param disturbance - Disturbance inputs (e.g., grade)
   * @returns State derivative vector dx/dt
   */ dynamics(t, x, control, disturbance) {
        const dx = new Array(x.length).fill(0);
        // Get all port speeds
        const allSpeeds = this.getAllSpeeds(x);
        // Update gear states from control
        for (const compName of this._gearState.keys()){
            const gearKey = `gear_${compName}`;
            if (gearKey in control) {
                const newGear = Math.floor(control[gearKey]);
                if (newGear !== this._gearState.get(compName)) {
                    this.setGear(compName, newGear);
                }
            }
        }
        // Compute torques from all components
        const allTorques = {};
        for (const [compName, component] of this._components){
            // Build port speeds dict for this component
            const portSpeeds = {};
            for (const portName of Object.keys(component.getMechanicalPorts())){
                const dofName = `${compName}.${portName}`;
                portSpeeds[portName] = allSpeeds[dofName] ?? 0;
            }
            // Build control inputs for this component
            const compControl = {};
            const torqueKey = `T_${compName}`;
            if (torqueKey in control) {
                compControl.torque = control[torqueKey];
            }
            // Get internal states for this component
            const internal = {};
            for (const stateName of component.stateNames){
                const fullName = `${compName}.${stateName}`;
                const idx = this.stateNames.indexOf(fullName);
                internal[stateName] = x[idx];
            }
            // Compute torques
            const torques = component.computeTorques(portSpeeds, compControl, internal);
            for (const [portName, torque] of Object.entries(torques)){
                const dofName = `${compName}.${portName}`;
                allTorques[dofName] = torque;
            }
        }
        // Build generalized force vector
        const tau = new Array(this.nMechanicalDofs).fill(0);
        // First, resolve all eliminated DOFs to independent DOFs
        const independentMap = new Map();
        for (const dof of this._independentDofs){
            independentMap.set(dof.name, dof);
        }
        const resolvedCoeffs = new Map();
        for (const elimName of this._eliminatedDofs.keys()){
            resolvedCoeffs.set(elimName, this._resolveDof(elimName, independentMap, this._eliminatedDofs));
        }
        for(let i = 0; i < this._independentDofs.length; i++){
            const dof = this._independentDofs[i];
            // Direct torque on this DOF
            tau[i] += allTorques[dof.name] ?? 0;
            // Add torques from constrained DOFs, using resolved coefficients
            for (const [elimName, resolved] of resolvedCoeffs){
                const coeff = resolved[dof.name] ?? 0;
                if (Math.abs(coeff) > 1e-12) {
                    tau[i] += coeff * (allTorques[elimName] ?? 0);
                }
            }
        }
        // Add load torque (from vehicle component) with grade
        const grade = disturbance.grade ?? 0;
        this._addLoadTorque(tau, allSpeeds, grade);
        // Solve for accelerations: J * omega_dot = tau
        const J = this.inertiaMatrix;
        if (this.nMechanicalDofs > 0) {
            const omegaDot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$math$2f$linalg$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["solveLinear"])(J, tau);
            for(let i = 0; i < this.nMechanicalDofs; i++){
                dx[i] = omegaDot[i];
            }
        }
        // Compute internal state derivatives
        for(let i = 0; i < this._internalStates.length; i++){
            const [compName, stateName] = this._internalStates[i];
            const component = this._components.get(compName);
            // Get port values
            const portValues = {};
            for (const portName of Object.keys(component.ports)){
                const dofName = `${compName}.${portName}`;
                portValues[`${portName}_speed`] = allSpeeds[dofName] ?? 0;
                portValues[`${portName}_torque`] = allTorques[dofName] ?? 0;
            }
            // Get current internal states
            const internal = {};
            for (const sn of component.stateNames){
                const fullName = `${compName}.${sn}`;
                const idx = this.stateNames.indexOf(fullName);
                internal[sn] = x[idx];
            }
            // Compute derivatives
            const derivs = component.computeStateDerivatives(internal, portValues);
            // Store in dx
            const stateIdx = this.nMechanicalDofs + i;
            dx[stateIdx] = derivs[stateName] ?? 0;
        }
        return dx;
    }
    _addLoadTorque(tau, speeds, grade) {
        if (this.topology.outputComponent === null) {
            return;
        }
        const outputComp = this.topology.outputComponent;
        const outputPort = this.topology.outputPort;
        const outputDof = `${outputComp}.${outputPort}`;
        // Get vehicle velocity from wheel speed
        const component = this._components.get(outputComp);
        const omega = speeds[outputDof] ?? 0;
        // If this is a vehicle component, get load torque
        if ('computeLoadTorque' in component) {
            const tLoad = component.computeLoadTorque(omega, grade);
            // Find which independent DOF is affected
            let found = false;
            for(let i = 0; i < this._independentDofs.length; i++){
                if (this._independentDofs[i].name === outputDof) {
                    tau[i] -= tLoad;
                    found = true;
                    break;
                }
            }
            if (!found) {
                // Output is a constrained DOF - resolve to independent DOFs
                const independentMap = new Map();
                for (const dof of this._independentDofs){
                    independentMap.set(dof.name, dof);
                }
                const resolved = this._resolveDof(outputDof, independentMap, this._eliminatedDofs);
                for (const [indDof, coeff] of Object.entries(resolved)){
                    for(let i = 0; i < this._independentDofs.length; i++){
                        if (this._independentDofs[i].name === indDof) {
                            tau[i] -= coeff * tLoad;
                            break;
                        }
                    }
                }
            }
        }
    }
    /** Get vehicle velocity from state vector. */ getVelocity(x) {
        if (this.topology.outputComponent === null) {
            return 0;
        }
        const outputComp = this.topology.outputComponent;
        const outputPort = this.topology.outputPort;
        const outputDof = `${outputComp}.${outputPort}`;
        const speeds = this.getAllSpeeds(x);
        const omega = speeds[outputDof] ?? 0;
        // Convert wheel speed to velocity
        const component = this._components.get(outputComp);
        if ('wheelSpeedToVelocity' in component) {
            return component.wheelSpeedToVelocity(omega);
        }
        return omega;
    }
    toString() {
        return `Drivetrain(dofs=${this.nMechanicalDofs}, states=${this.nInternalStates}, controls=${this.controlNames.length})`;
    }
}
}),
"[project]/packages/drivetrain-sim/src/core/topology.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Drivetrain topology builder with fluent API.
 */ __turbopack_context__.s([
    "DrivetrainTopology",
    ()=>DrivetrainTopology,
    "TopologyError",
    ()=>TopologyError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/ports.ts [app-ssr] (ecmascript)");
;
class TopologyError extends Error {
    component;
    port;
    constructor(message, component, port){
        const location = component ? ` at component '${component}'${port ? `.${port}` : ''}` : '';
        super(`TopologyError${location}: ${message}`), this.component = component, this.port = port;
        this.name = 'TopologyError';
    }
}
class DrivetrainTopology {
    components = new Map();
    connections = [];
    outputComponent = null;
    outputPort = null;
    _electricalBuses = new Map();
    /**
   * Add a component to the topology.
   *
   * @param name - Unique identifier for this component
   * @param component - The component instance
   * @returns this for method chaining
   */ addComponent(name, component) {
        if (this.components.has(name)) {
            throw new TopologyError(`Component name '${name}' already exists`, name);
        }
        component.name = name;
        this.components.set(name, component);
        return this;
    }
    /**
   * Connect two component ports.
   *
   * Creates a physical connection between ports. Both ports must be
   * of the same type (both mechanical or both electrical).
   */ connect(fromComponent, fromPort, toComponent, toPort) {
        // Validate components exist
        if (!this.components.has(fromComponent)) {
            throw new TopologyError(`Unknown component '${fromComponent}'`, fromComponent);
        }
        if (!this.components.has(toComponent)) {
            throw new TopologyError(`Unknown component '${toComponent}'`, toComponent);
        }
        const fromComp = this.components.get(fromComponent);
        const toComp = this.components.get(toComponent);
        // Validate ports exist
        if (!fromComp.hasPort(fromPort)) {
            throw new TopologyError(`No port '${fromPort}' on component`, fromComponent, fromPort);
        }
        if (!toComp.hasPort(toPort)) {
            throw new TopologyError(`No port '${toPort}' on component`, toComponent, toPort);
        }
        // Validate port types match
        const fromPortObj = fromComp.getPort(fromPort);
        const toPortObj = toComp.getPort(toPort);
        if (fromPortObj.portType !== toPortObj.portType) {
            throw new TopologyError(`Port type mismatch: ${fromPortObj.portType} != ${toPortObj.portType}`, fromComponent, fromPort);
        }
        // Check for duplicate connections
        const conn = {
            fromComponent,
            fromPort,
            toComponent,
            toPort
        };
        for (const existing of this.connections){
            if (existing.fromComponent === conn.fromComponent && existing.fromPort === conn.fromPort || existing.toComponent === conn.toComponent && existing.toPort === conn.toPort) {
                throw new TopologyError(`Port already connected`, fromComponent, fromPort);
            }
        }
        this.connections.push(conn);
        return this;
    }
    /**
   * Set the output port (connected to vehicle/ground).
   *
   * The output port is where the drivetrain connects to the vehicle
   * road load. This is typically the wheels port on the vehicle component.
   */ setOutput(component, port) {
        if (!this.components.has(component)) {
            throw new TopologyError(`Unknown component '${component}'`, component);
        }
        const comp = this.components.get(component);
        if (!comp.hasPort(port)) {
            throw new TopologyError(`No port '${port}' on component`, component, port);
        }
        this.outputComponent = component;
        this.outputPort = port;
        return this;
    }
    /**
   * Create a named electrical bus for power sharing.
   */ createElectricalBus(busName) {
        if (this._electricalBuses.has(busName)) {
            throw new TopologyError(`Electrical bus '${busName}' already exists`);
        }
        this._electricalBuses.set(busName, []);
        return this;
    }
    /**
   * Connect a component's electrical port to a bus.
   */ connectToBus(busName, component, port) {
        if (!this._electricalBuses.has(busName)) {
            throw new TopologyError(`Unknown electrical bus '${busName}'`);
        }
        if (!this.components.has(component)) {
            throw new TopologyError(`Unknown component '${component}'`, component);
        }
        const comp = this.components.get(component);
        if (!comp.hasPort(port)) {
            throw new TopologyError(`No port '${port}' on component`, component, port);
        }
        const portObj = comp.getPort(port);
        if (portObj.portType !== __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortType"].ELECTRICAL) {
            throw new TopologyError(`Port '${port}' is not electrical`, component, port);
        }
        this._electricalBuses.get(busName).push([
            component,
            port
        ]);
        return this;
    }
    /**
   * Get all connections involving a component.
   */ getConnectionsFor(component) {
        return this.connections.filter((c)=>c.fromComponent === component || c.toComponent === component);
    }
    /**
   * Find what a port is connected to.
   *
   * @returns [component_name, port_name] or null if not connected
   */ getConnectedPort(component, port) {
        for (const conn of this.connections){
            if (conn.fromComponent === component && conn.fromPort === port) {
                return [
                    conn.toComponent,
                    conn.toPort
                ];
            }
            if (conn.toComponent === component && conn.toPort === port) {
                return [
                    conn.fromComponent,
                    conn.fromPort
                ];
            }
        }
        return null;
    }
    /**
   * Validate the topology configuration.
   *
   * @returns List of validation error messages (empty if valid)
   */ validate() {
        const errors = [];
        // Check that we have at least one component
        if (this.components.size === 0) {
            errors.push('Topology has no components');
        }
        // Validate each component
        for (const [name, component] of this.components){
            const compErrors = component.validate();
            for (const err of compErrors){
                errors.push(`Component '${name}': ${err}`);
            }
        }
        // Check that output is set
        if (this.outputComponent === null) {
            errors.push('No output port set (use setOutput())');
        }
        // Check for disconnected components
        const connectedComponents = new Set();
        for (const conn of this.connections){
            connectedComponents.add(conn.fromComponent);
            connectedComponents.add(conn.toComponent);
        }
        for (const [name, component] of this.components){
            if (!connectedComponents.has(name) && this.components.size > 1) {
                // Allow if component only has electrical ports
                const mechPorts = component.getMechanicalPorts();
                if (Object.keys(mechPorts).length > 0) {
                    errors.push(`Component '${name}' is not connected to anything`);
                }
            }
        }
        // Check electrical bus connections
        for (const [busName, members] of this._electricalBuses){
            if (members.length < 2) {
                errors.push(`Electrical bus '${busName}' has fewer than 2 connections`);
            }
        }
        return errors;
    }
    /**
   * Compile the topology into a simulatable Drivetrain.
   */ build() {
        const errors = this.validate();
        if (errors.length > 0) {
            throw new TopologyError('Invalid topology: ' + errors.join('; '));
        }
        // Dynamic import to avoid circular dependency
        const { Drivetrain } = __turbopack_context__.r("[project]/packages/drivetrain-sim/src/core/drivetrain.ts [app-ssr] (ecmascript)");
        return new Drivetrain(this);
    }
    toString() {
        const compNames = Array.from(this.components.keys());
        return `DrivetrainTopology(components=[${compNames.join(', ')}], connections=${this.connections.length})`;
    }
}
}),
"[project]/packages/drivetrain-sim/src/core/index.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/**
 * Core module exports.
 */ __turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$component$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/component.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/ports.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$constraints$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/constraints.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$topology$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/topology.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$drivetrain$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/drivetrain.ts [app-ssr] (ecmascript)");
;
;
;
;
;
}),
"[project]/packages/drivetrain-sim/src/math/interpolate.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Interpolation utilities for drivetrain simulation.
 */ /**
 * Linear interpolation.
 *
 * @param x - Value to interpolate at
 * @param xp - X coordinates of data points (must be increasing)
 * @param fp - Y coordinates of data points
 * @returns Interpolated value at x
 */ __turbopack_context__.s([
    "interp",
    ()=>interp,
    "interp2d",
    ()=>interp2d,
    "searchSorted",
    ()=>searchSorted
]);
function interp(x, xp, fp) {
    if (xp.length !== fp.length || xp.length === 0) {
        throw new Error('xp and fp must have the same non-zero length');
    }
    // Clamp to range
    if (x <= xp[0]) {
        return fp[0];
    }
    if (x >= xp[xp.length - 1]) {
        return fp[fp.length - 1];
    }
    // Find interval
    let i = 0;
    while(i < xp.length - 1 && xp[i + 1] < x){
        i++;
    }
    // Linear interpolation
    const x0 = xp[i];
    const x1 = xp[i + 1];
    const y0 = fp[i];
    const y1 = fp[i + 1];
    const t = (x - x0) / (x1 - x0);
    return y0 + t * (y1 - y0);
}
function interp2d(x, y, xp, yp, zp) {
    // Clamp x
    const xClamped = Math.max(xp[0], Math.min(x, xp[xp.length - 1]));
    const yClamped = Math.max(yp[0], Math.min(y, yp[yp.length - 1]));
    // Find x interval
    let i = 0;
    while(i < xp.length - 2 && xp[i + 1] < xClamped){
        i++;
    }
    // Find y interval
    let j = 0;
    while(j < yp.length - 2 && yp[j + 1] < yClamped){
        j++;
    }
    // Get corners
    const x0 = xp[i];
    const x1 = xp[i + 1];
    const y0 = yp[j];
    const y1 = yp[j + 1];
    const z00 = zp[j][i];
    const z01 = zp[j][i + 1];
    const z10 = zp[j + 1][i];
    const z11 = zp[j + 1][i + 1];
    // Bilinear interpolation
    const tx = (xClamped - x0) / (x1 - x0);
    const ty = (yClamped - y0) / (y1 - y0);
    const z0 = z00 + tx * (z01 - z00);
    const z1 = z10 + tx * (z11 - z10);
    return z0 + ty * (z1 - z0);
}
function searchSorted(x, xp) {
    if (x <= xp[0]) return 0;
    if (x >= xp[xp.length - 1]) return xp.length - 2;
    let low = 0;
    let high = xp.length - 1;
    while(low < high - 1){
        const mid = Math.floor((low + high) / 2);
        if (xp[mid] <= x) {
            low = mid;
        } else {
            high = mid;
        }
    }
    return low;
}
}),
"[project]/packages/drivetrain-sim/src/components/engine.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Engine component for drivetrain simulation.
 */ __turbopack_context__.s([
    "CAT_3516E_PARAMS",
    ()=>CAT_3516E_PARAMS,
    "EngineComponent",
    ()=>EngineComponent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$component$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/component.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/ports.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$math$2f$interpolate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/math/interpolate.ts [app-ssr] (ecmascript)");
;
;
;
const CAT_3516E_PARAMS = {
    rpmIdle: 700,
    rpmMin: 700,
    rpmMax: 1800,
    pRated: 1_801_000,
    rpmRated: 1650,
    tPeak: 11_220,
    rpmPeakTorque: 1200,
    jEngine: 25,
    bsfc: 200e-9,
    torqueCurve: [
        [
            700,
            9_500
        ],
        [
            1000,
            10_800
        ],
        [
            1200,
            11_220
        ],
        [
            1400,
            10_900
        ],
        [
            1650,
            10_420
        ],
        [
            1800,
            9_800
        ]
    ]
};
class EngineComponent extends __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$component$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DrivetrainComponent"] {
    params;
    _rpmPoints;
    _torquePoints;
    constructor(params = {}, name = 'engine'){
        super(name);
        // Merge with defaults
        this.params = {
            rpmIdle: params.rpmIdle ?? 700,
            rpmMin: params.rpmMin ?? 700,
            rpmMax: params.rpmMax ?? 1800,
            pRated: params.pRated ?? 1_801_000,
            rpmRated: params.rpmRated ?? 1650,
            tPeak: params.tPeak ?? 11_220,
            rpmPeakTorque: params.rpmPeakTorque ?? 1200,
            jEngine: params.jEngine ?? 25,
            bsfc: params.bsfc ?? 200e-9,
            torqueCurve: params.torqueCurve ?? [
                [
                    700,
                    9_500
                ],
                [
                    1000,
                    10_800
                ],
                [
                    1200,
                    11_220
                ],
                [
                    1400,
                    10_900
                ],
                [
                    1650,
                    10_420
                ],
                [
                    1800,
                    9_800
                ]
            ]
        };
        // Build interpolation arrays
        this._rpmPoints = this.params.torqueCurve.map((p)=>p[0]);
        this._torquePoints = this.params.torqueCurve.map((p)=>p[1]);
    }
    get ports() {
        return {
            shaft: {
                name: 'shaft',
                portType: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortType"].MECHANICAL,
                direction: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortDirection"].OUTPUT,
                description: 'Engine crankshaft output'
            }
        };
    }
    get stateNames() {
        // Engine has no internal states in this model
        return [];
    }
    getInertia(portName) {
        if (portName === 'shaft') {
            return this.params.jEngine;
        }
        throw new Error(`Unknown port: ${portName}`);
    }
    getConstraints() {
        // Engine has no internal kinematic constraints
        return [];
    }
    /**
   * Get maximum available torque at given engine speed.
   *
   * Returns 0 below idle, interpolates curve in normal range,
   * and linearly tapers to 0 above max RPM.
   */ getMaxTorque(rpm) {
        if (rpm < this.params.rpmMin) {
            return 0;
        }
        if (rpm <= this.params.rpmMax) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$math$2f$interpolate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["interp"])(rpm, this._rpmPoints, this._torquePoints);
        }
        // Above max RPM: linearly taper torque to zero over 200 RPM
        const tAtMax = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$math$2f$interpolate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["interp"])(this.params.rpmMax, this._rpmPoints, this._torquePoints);
        const overspeedMargin = 200;
        const taperFactor = Math.max(0, 1 - (rpm - this.params.rpmMax) / overspeedMargin);
        return tAtMax * taperFactor;
    }
    /**
   * Get maximum torque at given angular velocity [rad/s].
   */ getMaxTorqueRads(omega) {
        const rpm = omega * 30 / Math.PI;
        return this.getMaxTorque(rpm);
    }
    /**
   * Clip torque command to valid range.
   */ clipTorque(rpm, torqueCmd) {
        const tMax = this.getMaxTorque(rpm);
        return Math.max(0, Math.min(torqueCmd, tMax));
    }
    /**
   * Get fuel consumption rate [kg/s].
   */ getFuelRate(torque, omega) {
        if (torque <= 0 || omega <= 0) {
            return 0;
        }
        const power = torque * omega;
        return power * this.params.bsfc;
    }
    /**
   * Check if operating point is within valid envelope.
   */ isValidOperatingPoint(rpm, torque) {
        if (rpm < this.params.rpmMin || rpm > this.params.rpmMax) {
            return false;
        }
        const tMax = this.getMaxTorque(rpm);
        return torque >= 0 && torque <= tMax;
    }
    computeTorques(portSpeeds, controlInputs, _internalStates) {
        const omega = Math.abs(portSpeeds.shaft ?? 0);
        const rpm = omega * 30 / Math.PI;
        // Get torque command
        const torqueCmd = controlInputs.torque ?? 0;
        // Clip to available torque
        const torque = this.clipTorque(rpm, torqueCmd);
        return {
            shaft: torque
        };
    }
    computeStateDerivatives(_internalStates, _portValues) {
        // No internal states
        return {};
    }
}
}),
"[project]/packages/drivetrain-sim/src/components/motor.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Electric motor/generator component for drivetrain simulation.
 */ __turbopack_context__.s([
    "MG1_PARAMS",
    ()=>MG1_PARAMS,
    "MG2_PARAMS",
    ()=>MG2_PARAMS,
    "MotorComponent",
    ()=>MotorComponent,
    "createMG1",
    ()=>createMG1,
    "createMG2",
    ()=>createMG2
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$component$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/component.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/ports.ts [app-ssr] (ecmascript)");
;
;
const MG1_PARAMS = {
    pMax: 200_000,
    tMax: 3_000,
    rpmMax: 6_000,
    jRotor: 2.0,
    eta: 0.92
};
const MG2_PARAMS = {
    pMax: 350_000,
    pBoost: 500_000,
    tMax: 2_000,
    rpmMax: 4_000,
    jRotor: 4.0,
    eta: 0.92
};
class MotorComponent extends __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$component$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DrivetrainComponent"] {
    params;
    _omegaBase;
    _omegaMax;
    constructor(params = {}, name = 'motor'){
        super(name);
        const pMax = params.pMax ?? 200_000;
        const tMax = params.tMax ?? 3_000;
        // Compute base speed if not provided: P_max / T_max (in rad/s)
        const computedRpmBase = pMax / tMax * (30 / Math.PI);
        this.params = {
            pMax,
            pBoost: params.pBoost ?? null,
            tMax,
            rpmMax: params.rpmMax ?? 6_000,
            rpmBase: params.rpmBase ?? computedRpmBase,
            jRotor: params.jRotor ?? 2.0,
            eta: params.eta ?? 0.92
        };
        this._omegaBase = this.params.rpmBase * Math.PI / 30;
        this._omegaMax = this.params.rpmMax * Math.PI / 30;
    }
    get ports() {
        return {
            shaft: {
                name: 'shaft',
                portType: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortType"].MECHANICAL,
                direction: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortDirection"].BIDIRECTIONAL,
                description: 'Motor/generator shaft'
            },
            electrical: {
                name: 'electrical',
                portType: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortType"].ELECTRICAL,
                direction: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortDirection"].BIDIRECTIONAL,
                description: 'Electrical power connection'
            }
        };
    }
    get stateNames() {
        return [];
    }
    getInertia(portName) {
        if (portName === 'shaft') {
            return this.params.jRotor;
        }
        if (portName === 'electrical') {
            return 0; // Electrical port has no inertia
        }
        throw new Error(`Unknown port: ${portName}`);
    }
    getConstraints() {
        return [];
    }
    /**
   * Get maximum available torque at given speed.
   *
   * @param rpm - Motor speed [rpm] (absolute value used)
   * @param useBoost - If true, use boost power in constant power region
   * @returns Maximum torque [N*m]
   */ getMaxTorque(rpm, useBoost = false) {
        rpm = Math.abs(rpm);
        if (rpm > this.params.rpmMax) {
            return 0;
        }
        const omega = rpm * Math.PI / 30;
        const pMax = useBoost && this.params.pBoost ? this.params.pBoost : this.params.pMax;
        if (rpm <= this.params.rpmBase) {
            // Constant torque region
            return this.params.tMax;
        } else {
            // Constant power region: T = P / ω
            if (omega > 0) {
                return Math.min(pMax / omega, this.params.tMax);
            }
            return this.params.tMax;
        }
    }
    /**
   * Get maximum torque at given angular velocity.
   */ getMaxTorqueRads(omega, useBoost = false) {
        const rpm = Math.abs(omega) * 30 / Math.PI;
        return this.getMaxTorque(rpm, useBoost);
    }
    /**
   * Get torque limits for 4-quadrant operation.
   *
   * @returns Tuple of [T_min, T_max] [N*m]
   */ getTorqueLimits(rpm, useBoost = false) {
        const tMax = this.getMaxTorque(rpm, useBoost);
        return [
            -tMax,
            tMax
        ];
    }
    /**
   * Clip torque command to valid range.
   */ clipTorque(rpm, torqueCmd, useBoost = false) {
        const [tMin, tMax] = this.getTorqueLimits(rpm, useBoost);
        return Math.max(tMin, Math.min(torqueCmd, tMax));
    }
    /**
   * Calculate electrical power consumed/generated.
   *
   * Sign convention:
   * - Positive power: consuming from battery (motoring)
   * - Negative power: supplying to battery (generating)
   */ getElectricalPower(torque, omega) {
        const pMech = torque * omega;
        if (pMech > 0) {
            // Motoring: electrical power = mechanical / efficiency
            return pMech / this.params.eta;
        } else {
            // Generating: electrical power = mechanical * efficiency
            return pMech * this.params.eta;
        }
    }
    /**
   * Check if operating point is within motor envelope.
   */ isValidOperatingPoint(rpm, torque) {
        const [tMin, tMax] = this.getTorqueLimits(rpm);
        return torque >= tMin && torque <= tMax;
    }
    computeTorques(portSpeeds, controlInputs, _internalStates) {
        const omega = portSpeeds.shaft ?? 0;
        const rpm = Math.abs(omega) * 30 / Math.PI;
        const torqueCmd = controlInputs.torque ?? 0;
        const useBoost = Boolean(controlInputs.boost);
        // Clip to valid operating range
        const torque = this.clipTorque(rpm, torqueCmd, useBoost);
        return {
            shaft: torque
        };
    }
    computeStateDerivatives(_internalStates, _portValues) {
        return {};
    }
}
function createMG1() {
    return new MotorComponent(MG1_PARAMS, 'MG1');
}
function createMG2() {
    return new MotorComponent(MG2_PARAMS, 'MG2');
}
}),
"[project]/packages/drivetrain-sim/src/components/gearbox.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * N-speed gearbox component for drivetrain simulation.
 */ __turbopack_context__.s([
    "DIESEL_7SPEED_PARAMS",
    ()=>DIESEL_7SPEED_PARAMS,
    "ECVT_GEARBOX_PARAMS",
    ()=>ECVT_GEARBOX_PARAMS,
    "FinalDriveComponent",
    ()=>FinalDriveComponent,
    "FixedRatioGearComponent",
    ()=>FixedRatioGearComponent,
    "NSpeedGearboxComponent",
    ()=>NSpeedGearboxComponent,
    "SINGLE_SPEED_PARAMS",
    ()=>SINGLE_SPEED_PARAMS
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$component$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/component.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/ports.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$constraints$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/constraints.ts [app-ssr] (ecmascript)");
;
;
;
const ECVT_GEARBOX_PARAMS = {
    ratios: [
        5.0,
        0.67
    ],
    efficiencies: [
        0.97,
        0.97
    ],
    jInput: 5.0,
    jOutput: 5.0
};
const DIESEL_7SPEED_PARAMS = {
    ratios: [
        4.59,
        2.95,
        1.94,
        1.40,
        1.0,
        0.74,
        0.65
    ],
    efficiencies: [
        0.97,
        0.97,
        0.97,
        0.97,
        0.97,
        0.97,
        0.97
    ],
    jInput: 5.0,
    jOutput: 5.0
};
const SINGLE_SPEED_PARAMS = {
    ratios: [
        10.0
    ],
    efficiencies: [
        0.98
    ],
    jInput: 2.0,
    jOutput: 5.0
};
class NSpeedGearboxComponent extends __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$component$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DrivetrainComponent"] {
    params;
    _currentGear;
    constructor(params = {}, name = 'gearbox'){
        super(name);
        const ratios = params.ratios ?? [
            3.5,
            2.0,
            1.0
        ];
        const efficiencies = params.efficiencies ?? ratios.map(()=>0.97);
        // Ensure efficiencies list matches ratios
        const finalEfficiencies = efficiencies.length === ratios.length ? efficiencies : ratios.map(()=>0.97);
        this.params = {
            ratios,
            efficiencies: finalEfficiencies,
            jInput: params.jInput ?? 5.0,
            jOutput: params.jOutput ?? 5.0,
            shiftTime: params.shiftTime ?? 0.5
        };
        this._currentGear = 0;
    }
    get nGears() {
        return this.params.ratios.length;
    }
    get gear() {
        return this._currentGear;
    }
    set gear(value) {
        this._currentGear = Math.max(0, Math.min(value, this.nGears - 1));
    }
    get currentRatio() {
        return this.params.ratios[this._currentGear];
    }
    get currentEfficiency() {
        return this.params.efficiencies[this._currentGear];
    }
    get ports() {
        return {
            input: {
                name: 'input',
                portType: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortType"].MECHANICAL,
                direction: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortDirection"].INPUT,
                description: 'High-speed input shaft'
            },
            output: {
                name: 'output',
                portType: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortType"].MECHANICAL,
                direction: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortDirection"].OUTPUT,
                description: 'Low-speed output shaft'
            }
        };
    }
    get stateNames() {
        return [];
    }
    getInertia(portName) {
        if (portName === 'input') {
            return this.params.jInput;
        }
        if (portName === 'output') {
            return this.params.jOutput;
        }
        throw new Error(`Unknown port: ${portName}`);
    }
    getConstraints() {
        return [
            new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$constraints$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GearRatioConstraint"]({
                inputPort: 'input',
                outputPort: 'output',
                ratio: this.currentRatio,
                efficiency: this.currentEfficiency
            })
        ];
    }
    /**
   * Get gear ratio for specified gear.
   */ getRatio(gear) {
        const g = gear ?? this._currentGear;
        return this.params.ratios[Math.max(0, Math.min(g, this.nGears - 1))];
    }
    /**
   * Get efficiency for specified gear.
   */ getEfficiency(gear) {
        const g = gear ?? this._currentGear;
        return this.params.efficiencies[Math.max(0, Math.min(g, this.nGears - 1))];
    }
    /**
   * Convert input speed to output speed.
   */ inputToOutputSpeed(omegaIn, gear) {
        return omegaIn / this.getRatio(gear);
    }
    /**
   * Convert output speed to input speed.
   */ outputToInputSpeed(omegaOut, gear) {
        return omegaOut * this.getRatio(gear);
    }
    /**
   * Convert input torque to output torque.
   */ inputToOutputTorque(tIn, gear) {
        const K = this.getRatio(gear);
        const eta = this.getEfficiency(gear);
        return tIn * K * eta;
    }
    /**
   * Convert output torque to input torque.
   */ outputToInputTorque(tOut, gear) {
        const K = this.getRatio(gear);
        const eta = this.getEfficiency(gear);
        return tOut / (K * eta);
    }
    /**
   * Calculate inertia reflected to input side.
   */ getReflectedInertia(jOutput, gear) {
        const K = this.getRatio(gear);
        return jOutput / (K * K);
    }
    computeTorques(_portSpeeds, controlInputs, _internalStates) {
        // Update gear selection from control
        if ('gear' in controlInputs) {
            this.gear = Math.floor(controlInputs.gear);
        }
        // Gearbox itself doesn't produce torque, it transforms it
        return {};
    }
    computeStateDerivatives(_internalStates, _portValues) {
        return {};
    }
}
class FinalDriveComponent extends NSpeedGearboxComponent {
    constructor(ratio = 16.0, efficiency = 0.96, name = 'final_drive'){
        super({
            ratios: [
                ratio
            ],
            efficiencies: [
                efficiency
            ],
            jInput: 2.0,
            jOutput: 10.0
        }, name);
    }
    get ratio() {
        return this.params.ratios[0];
    }
}
class FixedRatioGearComponent extends NSpeedGearboxComponent {
    constructor(ratio = 1.0, efficiency = 0.98, jInput = 1.0, jOutput = 1.0, name = 'gear'){
        super({
            ratios: [
                ratio
            ],
            efficiencies: [
                efficiency
            ],
            jInput,
            jOutput
        }, name);
    }
    get ratio() {
        return this.params.ratios[0];
    }
    get efficiency() {
        return this.params.efficiencies[0];
    }
}
}),
"[project]/packages/drivetrain-sim/src/components/planetary.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Planetary gear component for power-split drivetrains.
 */ __turbopack_context__.s([
    "CAT_793D_PLANETARY_PARAMS",
    ()=>CAT_793D_PLANETARY_PARAMS,
    "PlanetaryGearComponent",
    ()=>PlanetaryGearComponent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$component$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/component.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/ports.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$constraints$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/constraints.ts [app-ssr] (ecmascript)");
;
;
;
const CAT_793D_PLANETARY_PARAMS = {
    zSun: 30,
    zRing: 90,
    jSun: 0.5,
    jCarrier: 1.0,
    jRing: 0.5
};
class PlanetaryGearComponent extends __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$component$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DrivetrainComponent"] {
    params;
    _rho;
    constructor(params = {}, name = 'planetary'){
        super(name);
        this.params = {
            zSun: params.zSun ?? 30,
            zRing: params.zRing ?? 90,
            jSun: params.jSun ?? 0.5,
            jCarrier: params.jCarrier ?? 1.0,
            jRing: params.jRing ?? 0.5,
            eta: params.eta ?? 0.98
        };
        this._rho = this.params.zRing / this.params.zSun;
    }
    /** Planetary ratio ρ = Z_ring / Z_sun. */ get rho() {
        return this._rho;
    }
    get ports() {
        return {
            sun: {
                name: 'sun',
                portType: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortType"].MECHANICAL,
                direction: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortDirection"].BIDIRECTIONAL,
                description: 'Sun gear (typically MG1)'
            },
            carrier: {
                name: 'carrier',
                portType: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortType"].MECHANICAL,
                direction: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortDirection"].BIDIRECTIONAL,
                description: 'Carrier (typically engine)'
            },
            ring: {
                name: 'ring',
                portType: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortType"].MECHANICAL,
                direction: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortDirection"].BIDIRECTIONAL,
                description: 'Ring gear (typically output)'
            }
        };
    }
    get stateNames() {
        return [];
    }
    getInertia(portName) {
        if (portName === 'sun') {
            return this.params.jSun;
        }
        if (portName === 'carrier') {
            return this.params.jCarrier;
        }
        if (portName === 'ring') {
            return this.params.jRing;
        }
        throw new Error(`Unknown port: ${portName}`);
    }
    getConstraints() {
        return [
            new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$constraints$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WillisConstraint"]({
                sunPort: 'sun',
                carrierPort: 'carrier',
                ringPort: 'ring',
                rho: this._rho
            })
        ];
    }
    /**
   * Calculate sun gear speed from Willis equation.
   *
   * ω_sun = (1 + ρ) × ω_carrier - ρ × ω_ring
   */ calcSunSpeed(omegaCarrier, omegaRing) {
        return (1 + this._rho) * omegaCarrier - this._rho * omegaRing;
    }
    /**
   * Calculate carrier speed from sun and ring speeds.
   */ calcCarrierSpeed(omegaSun, omegaRing) {
        return (omegaSun + this._rho * omegaRing) / (1 + this._rho);
    }
    /**
   * Calculate ring speed from carrier and sun speeds.
   */ calcRingSpeed(omegaCarrier, omegaSun) {
        return ((1 + this._rho) * omegaCarrier - omegaSun) / this._rho;
    }
    /**
   * Get torque balance ratios (sun : carrier : ring).
   *
   * For a planetary gear in static equilibrium:
   * τ_sun + τ_carrier + τ_ring = 0
   */ getTorqueRatios() {
        return [
            1.0,
            -(1 + this._rho),
            this._rho
        ];
    }
    /**
   * Calculate sun and ring torques from carrier torque.
   *
   * Based on torque ratios 1 : -(1+ρ) : ρ
   */ calcTorqueSplit(tCarrier) {
        // From T_carrier and ratio τ_carrier = -(1+ρ)
        const tSun = -tCarrier / (1 + this._rho);
        const tRing = tSun * this._rho;
        return [
            tSun,
            tRing
        ];
    }
    /**
   * Get inertia coupling coefficients for 2-DOF reduction.
   *
   * When reducing from 3-DOF to 2-DOF using Willis constraint:
   *
   * J = [J_c + (1+ρ)² × J_s,     -(1+ρ)×ρ × J_s    ]
   *     [-(1+ρ)×ρ × J_s,          J_r + ρ² × J_s    ]
   *
   * @param jSun - Sun gear inertia (including attached motor)
   * @returns [J_carrier_add, J_coupling, J_ring_add]
   */ getInertiaCoefficients(jSun) {
        const jCarrierAdd = (1 + this._rho) ** 2 * jSun;
        const jCoupling = -(1 + this._rho) * this._rho * jSun;
        const jRingAdd = this._rho ** 2 * jSun;
        return [
            jCarrierAdd,
            jCoupling,
            jRingAdd
        ];
    }
    computeTorques(_portSpeeds, _controlInputs, _internalStates) {
        // Planetary gear doesn't generate torque, it distributes it
        return {};
    }
    computeStateDerivatives(_internalStates, _portValues) {
        return {};
    }
}
}),
"[project]/packages/drivetrain-sim/src/components/battery.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Battery component for hybrid and electric drivetrains.
 */ __turbopack_context__.s([
    "BatteryComponent",
    ()=>BatteryComponent,
    "CAT_793D_BATTERY_PARAMS",
    ()=>CAT_793D_BATTERY_PARAMS,
    "EV_BATTERY_PARAMS",
    ()=>EV_BATTERY_PARAMS,
    "SERIES_HYBRID_BATTERY_PARAMS",
    ()=>SERIES_HYBRID_BATTERY_PARAMS
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$component$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/component.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/ports.ts [app-ssr] (ecmascript)");
;
;
const CAT_793D_BATTERY_PARAMS = {
    capacityKwh: 200.0,
    vOc: 750.0,
    vNom: 700.0,
    rInt: 0.05,
    pMaxDischarge: 1_000_000.0,
    pMaxCharge: 500_000.0,
    socMin: 0.3,
    socMax: 0.8,
    socInit: 0.6
};
const SERIES_HYBRID_BATTERY_PARAMS = {
    capacityKwh: 400.0,
    vOc: 750.0,
    vNom: 700.0,
    rInt: 0.03,
    pMaxDischarge: 1_500_000.0,
    pMaxCharge: 800_000.0,
    socMin: 0.2,
    socMax: 0.9,
    socInit: 0.6
};
const EV_BATTERY_PARAMS = {
    capacityKwh: 600.0,
    vOc: 800.0,
    vNom: 750.0,
    rInt: 0.02,
    pMaxDischarge: 2_000_000.0,
    pMaxCharge: 1_000_000.0,
    socMin: 0.1,
    socMax: 0.95,
    socInit: 0.8
};
class BatteryComponent extends __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$component$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DrivetrainComponent"] {
    params;
    _soc;
    constructor(params = {}, name = 'battery'){
        super(name);
        this.params = {
            capacityKwh: params.capacityKwh ?? 200.0,
            vOc: params.vOc ?? 750.0,
            vNom: params.vNom ?? 700.0,
            rInt: params.rInt ?? 0.05,
            pMaxDischarge: params.pMaxDischarge ?? 1_000_000.0,
            pMaxCharge: params.pMaxCharge ?? 500_000.0,
            socMin: params.socMin ?? 0.3,
            socMax: params.socMax ?? 0.8,
            socInit: params.socInit ?? 0.6
        };
        this._soc = this.params.socInit;
    }
    /** Capacity in Joules. */ get qCapacity() {
        return this.params.capacityKwh * 3600 * 1000;
    }
    /** Capacity in Amp-hours. */ get qAh() {
        return this.qCapacity / (this.params.vNom * 3600);
    }
    /** Current state of charge [0-1]. */ get soc() {
        return this._soc;
    }
    set soc(value) {
        this._soc = Math.max(0, Math.min(1, value));
    }
    get ports() {
        return {
            electrical: {
                name: 'electrical',
                portType: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortType"].ELECTRICAL,
                direction: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortDirection"].BIDIRECTIONAL,
                description: 'Electrical power connection'
            }
        };
    }
    get stateNames() {
        return [
            'SOC'
        ];
    }
    getInertia(_portName) {
        return 0; // Battery has no mechanical inertia
    }
    getConstraints() {
        return [];
    }
    /**
   * Get open circuit voltage (could be SOC-dependent).
   */ getOpenCircuitVoltage(_soc) {
        // Simple model: constant V_oc
        return this.params.vOc;
    }
    /**
   * Calculate current from power demand.
   *
   * Solves: P = V_oc × I - R_int × I²
   *
   * @param power - Electrical power [W] (positive = discharge)
   * @returns Current [A] (positive = discharge)
   */ getCurrentFromPower(power, soc) {
        const currentSoc = soc ?? this._soc;
        const vOc = this.getOpenCircuitVoltage(currentSoc);
        const R = this.params.rInt;
        if (Math.abs(power) < 1e-6) {
            return 0;
        }
        // Quadratic: R × I² - V_oc × I + P = 0
        // I = (V_oc - sqrt(V_oc² - 4RP)) / (2R)
        const discriminant = vOc * vOc - 4 * R * power;
        if (discriminant < 0) {
            // Power exceeds capability - return limiting current
            return power > 0 ? vOc / (2 * R) : -vOc / (2 * R);
        }
        // Use solution that gives smaller magnitude current
        return (vOc - Math.sqrt(discriminant)) / (2 * R);
    }
    /**
   * Get terminal voltage at given current.
   */ getTerminalVoltage(current, soc) {
        const currentSoc = soc ?? this._soc;
        const vOc = this.getOpenCircuitVoltage(currentSoc);
        return vOc - current * this.params.rInt;
    }
    /**
   * Get power limits with SOC-based derating.
   *
   * @returns [P_min, P_max] [W]
   *   P_min is negative (max charging), P_max is positive (max discharging)
   */ getPowerLimits(soc) {
        const currentSoc = soc ?? this._soc;
        let pDischarge = this.params.pMaxDischarge;
        let pCharge = this.params.pMaxCharge;
        // Derate discharge at low SOC
        if (currentSoc < this.params.socMin + 0.1) {
            const factor = Math.max(0, (currentSoc - this.params.socMin) / 0.1);
            pDischarge *= factor;
        }
        // Derate charge at high SOC
        if (currentSoc > this.params.socMax - 0.1) {
            const factor = Math.max(0, (this.params.socMax - currentSoc) / 0.1);
            pCharge *= factor;
        }
        return [
            -pCharge,
            pDischarge
        ];
    }
    /**
   * Clip power to valid range.
   */ clipPower(power, soc) {
        const [pMin, pMax] = this.getPowerLimits(soc);
        return Math.max(pMin, Math.min(power, pMax));
    }
    /**
   * Calculate SOC rate of change.
   *
   * dSOC/dt = -I / Q_capacity
   */ getSocDerivative(power, soc) {
        const currentSoc = soc ?? this._soc;
        const current = this.getCurrentFromPower(power, currentSoc);
        // Q_capacity is in Coulombs (A·s)
        const Q = this.qCapacity / this.params.vNom;
        return -current / Q;
    }
    /**
   * Check if battery can provide requested power.
   */ canProvidePower(power, soc) {
        const [pMin, pMax] = this.getPowerLimits(soc);
        return power >= pMin && power <= pMax;
    }
    /**
   * Get remaining usable energy [J].
   */ getEnergyRemaining(soc) {
        const currentSoc = soc ?? this._soc;
        const usableSoc = Math.max(0, currentSoc - this.params.socMin);
        return usableSoc * this.qCapacity;
    }
    computeTorques(_portSpeeds, _controlInputs, _internalStates) {
        return {}; // Battery doesn't produce torque
    }
    computeStateDerivatives(internalStates, portValues) {
        const soc = internalStates.SOC ?? this._soc;
        const power = portValues.electrical_power ?? 0;
        const dSoc = this.getSocDerivative(power, soc);
        return {
            SOC: dSoc
        };
    }
}
}),
"[project]/packages/drivetrain-sim/src/components/vehicle.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Vehicle component with road load model.
 */ __turbopack_context__.s([
    "CAT_793D_GOOD_ROAD",
    ()=>CAT_793D_GOOD_ROAD,
    "CAT_793D_PARAMS",
    ()=>CAT_793D_PARAMS,
    "CAT_793D_POOR_ROAD",
    ()=>CAT_793D_POOR_ROAD,
    "VehicleComponent",
    ()=>VehicleComponent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$component$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/component.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/ports.ts [app-ssr] (ecmascript)");
;
;
const CAT_793D_PARAMS = {
    mEmpty: 159_350,
    mPayload: 190_000,
    rWheel: 1.78,
    aFrontal: 45.0,
    cD: 0.9,
    cR: 0.025,
    vMax: 54.2 / 3.6,
    jWheels: 500,
    rhoAir: 1.225,
    g: 9.81
};
const CAT_793D_GOOD_ROAD = {
    ...CAT_793D_PARAMS,
    cR: 0.015
};
const CAT_793D_POOR_ROAD = {
    ...CAT_793D_PARAMS,
    cR: 0.035
};
class VehicleComponent extends __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$component$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DrivetrainComponent"] {
    params;
    _payloadFraction;
    _mass;
    constructor(params = {}, payloadFraction = 1.0, name = 'vehicle'){
        super(name);
        // Merge with defaults
        this.params = {
            mEmpty: params.mEmpty ?? 159_350,
            mPayload: params.mPayload ?? 190_000,
            rWheel: params.rWheel ?? 1.78,
            aFrontal: params.aFrontal ?? 45.0,
            cD: params.cD ?? 0.9,
            cR: params.cR ?? 0.025,
            vMax: params.vMax ?? 54.2 / 3.6,
            jWheels: params.jWheels ?? 500,
            rhoAir: params.rhoAir ?? 1.225,
            g: params.g ?? 9.81
        };
        this._payloadFraction = Math.max(0, Math.min(1, payloadFraction));
        this._mass = this.params.mEmpty + this._payloadFraction * this.params.mPayload;
    }
    get mass() {
        return this._mass;
    }
    get payloadFraction() {
        return this._payloadFraction;
    }
    set payloadFraction(value) {
        this._payloadFraction = Math.max(0, Math.min(1, value));
        this._mass = this.params.mEmpty + this._payloadFraction * this.params.mPayload;
    }
    get ports() {
        return {
            wheels: {
                name: 'wheels',
                portType: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortType"].MECHANICAL,
                direction: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortDirection"].INPUT,
                description: 'Wheel input (driven by final drive)'
            }
        };
    }
    get stateNames() {
        // Vehicle has no internal states in this model
        return [];
    }
    getInertia(portName) {
        if (portName === 'wheels') {
            // Effective inertia: wheel inertia + translational mass reflected
            return this.params.jWheels + this._mass * this.params.rWheel * this.params.rWheel;
        }
        throw new Error(`Unknown port: ${portName}`);
    }
    getConstraints() {
        return [];
    }
    /**
   * Calculate total road load force [N].
   *
   * @param velocity - Vehicle velocity [m/s]
   * @param grade - Road grade (fraction, e.g., 0.05 for 5%)
   * @returns Total resistance force [N]
   */ calcTotalRoadLoad(velocity, grade) {
        const theta = Math.atan(grade);
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);
        // Grade resistance (always acts in direction of gravity)
        const fGrade = this._mass * this.params.g * sinTheta;
        // Rolling resistance (always positive, opposes motion)
        const fRoll = this.params.cR * this._mass * this.params.g * cosTheta;
        // Aerodynamic drag (opposes motion direction)
        const v = Math.abs(velocity);
        const fAero = 0.5 * this.params.rhoAir * this.params.cD * this.params.aFrontal * v * v;
        const signV = velocity >= 0 ? 1 : -1;
        // Match Python: F_grade + F_roll + F_aero * sign(v)
        // Grade and rolling resistance don't depend on direction,
        // only aero drag opposes the actual motion direction
        return fGrade + fRoll + fAero * signV;
    }
    /**
   * Calculate wheel torque demand for road load [N*m].
   */ calcWheelTorqueDemand(velocity, grade) {
        const force = this.calcTotalRoadLoad(velocity, grade);
        return force * this.params.rWheel;
    }
    /**
   * Compute load torque at the wheels for dynamics simulation.
   *
   * @param omegaWheel - Wheel angular velocity [rad/s]
   * @param grade - Road grade (fraction)
   * @returns Load torque [N*m]
   */ computeLoadTorque(omegaWheel, grade) {
        const velocity = omegaWheel * this.params.rWheel;
        return this.calcWheelTorqueDemand(velocity, grade);
    }
    /**
   * Convert wheel speed to vehicle velocity [m/s].
   */ wheelSpeedToVelocity(omegaWheel) {
        return omegaWheel * this.params.rWheel;
    }
    /**
   * Convert vehicle velocity to wheel speed [rad/s].
   */ velocityToWheelSpeed(velocity) {
        return velocity / this.params.rWheel;
    }
    /**
   * Get effective mass including rotational inertia contribution.
   */ getEffectiveMass() {
        // m_eff = m + J_wheels / r^2
        return this._mass + this.params.jWheels / (this.params.rWheel * this.params.rWheel);
    }
    computeTorques(_portSpeeds, _controlInputs, _internalStates) {
        // Vehicle doesn't produce torque, only consumes it
        return {};
    }
    computeStateDerivatives(_internalStates, _portValues) {
        return {};
    }
}
}),
"[project]/packages/drivetrain-sim/src/components/index.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/**
 * Component exports.
 */ __turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$engine$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/components/engine.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$motor$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/components/motor.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$gearbox$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/components/gearbox.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$planetary$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/components/planetary.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$battery$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/components/battery.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$vehicle$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/components/vehicle.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
}),
"[project]/packages/drivetrain-sim/src/math/index.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/**
 * Math utilities exports.
 */ __turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$math$2f$linalg$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/math/linalg.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$math$2f$interpolate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/math/interpolate.ts [app-ssr] (ecmascript)");
;
;
}),
"[project]/packages/drivetrain-sim/src/simulation/config.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Simulation configuration.
 */ /**
 * Configuration for drivetrain simulation.
 */ __turbopack_context__.s([
    "DEFAULT_CONFIG",
    ()=>DEFAULT_CONFIG,
    "HIGH_FIDELITY_SIM",
    ()=>HIGH_FIDELITY_SIM,
    "LONG_SIM",
    ()=>LONG_SIM,
    "MEDIUM_SIM",
    ()=>MEDIUM_SIM,
    "SHORT_SIM",
    ()=>SHORT_SIM,
    "createConfig",
    ()=>createConfig,
    "getNumOutputPoints",
    ()=>getNumOutputPoints,
    "getOutputTimes",
    ()=>getOutputTimes
]);
const DEFAULT_CONFIG = {
    tStart: 0.0,
    tEnd: 60.0,
    dtOutput: 0.1,
    method: 'RK4',
    rtol: 1e-6,
    atol: 1e-8,
    maxStep: 0.01
};
const SHORT_SIM = {
    ...DEFAULT_CONFIG,
    tEnd: 10.0,
    dtOutput: 0.05
};
const MEDIUM_SIM = {
    ...DEFAULT_CONFIG,
    tEnd: 60.0,
    dtOutput: 0.1
};
const LONG_SIM = {
    ...DEFAULT_CONFIG,
    tEnd: 300.0,
    dtOutput: 0.5
};
const HIGH_FIDELITY_SIM = {
    ...DEFAULT_CONFIG,
    tEnd: 60.0,
    dtOutput: 0.01,
    rtol: 1e-8,
    atol: 1e-11
};
function getNumOutputPoints(config) {
    return Math.floor((config.tEnd - config.tStart) / config.dtOutput) + 1;
}
function getOutputTimes(config) {
    const n = getNumOutputPoints(config);
    const times = [];
    for(let i = 0; i < n; i++){
        times.push(config.tStart + i * config.dtOutput);
    }
    return times;
}
function createConfig(options = {}) {
    const config = {
        ...DEFAULT_CONFIG,
        ...options
    };
    if (config.tEnd <= config.tStart) {
        throw new Error('tEnd must be greater than tStart');
    }
    if (config.dtOutput <= 0) {
        throw new Error('dtOutput must be positive');
    }
    return config;
}
}),
"[project]/packages/drivetrain-sim/src/simulation/result.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Simulation result container.
 */ __turbopack_context__.s([
    "createResult",
    ()=>createResult,
    "getAverageDt",
    ()=>getAverageDt,
    "getControl",
    ()=>getControl,
    "getDuration",
    ()=>getDuration,
    "getEnginePower",
    ()=>getEnginePower,
    "getFinalState",
    ()=>getFinalState,
    "getFuelRate",
    ()=>getFuelRate,
    "getFuelTotal",
    ()=>getFuelTotal,
    "getMax",
    ()=>getMax,
    "getMean",
    ()=>getMean,
    "getMin",
    ()=>getMin,
    "getNumPoints",
    ()=>getNumPoints,
    "getOutput",
    ()=>getOutput,
    "getSoc",
    ()=>getSoc,
    "getState",
    ()=>getState,
    "getVelocity",
    ()=>getVelocity,
    "getVelocityKmh",
    ()=>getVelocityKmh,
    "resampleResult",
    ()=>resampleResult,
    "sliceResult",
    ()=>sliceResult,
    "summarizeResult",
    ()=>summarizeResult
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$math$2f$interpolate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/math/interpolate.ts [app-ssr] (ecmascript)");
;
function createResult() {
    return {
        time: [],
        states: {},
        controls: {},
        outputs: {},
        metadata: {}
    };
}
function getNumPoints(result) {
    return result.time.length;
}
function getDuration(result) {
    const n = result.time.length;
    return n > 1 ? result.time[n - 1] - result.time[0] : 0;
}
function getAverageDt(result) {
    const n = result.time.length;
    return n > 1 ? getDuration(result) / (n - 1) : 0;
}
function getState(result, name) {
    return result.states[name] ?? null;
}
function getControl(result, name) {
    return result.controls[name] ?? null;
}
function getOutput(result, name) {
    return result.outputs[name] ?? null;
}
function getVelocity(result) {
    return result.outputs.velocity ?? null;
}
function getVelocityKmh(result) {
    const v = getVelocity(result);
    return v ? v.map((val)=>val * 3.6) : null;
}
function getSoc(result) {
    // Look for SOC in states (component.SOC format)
    for (const [name, values] of Object.entries(result.states)){
        if (name.endsWith('.SOC') || name === 'SOC') {
            return values;
        }
    }
    return null;
}
function getEnginePower(result) {
    return result.outputs.P_engine ?? null;
}
function getFuelRate(result) {
    return result.outputs.fuel_rate ?? null;
}
function getFuelTotal(result) {
    const rate = getFuelRate(result);
    if (!rate || result.time.length < 2) {
        return null;
    }
    // Trapezoidal integration
    let total = 0;
    for(let i = 1; i < result.time.length; i++){
        const dt = result.time[i] - result.time[i - 1];
        total += 0.5 * (rate[i - 1] + rate[i]) * dt;
    }
    return total;
}
function getFinalState(result) {
    const final = {};
    for (const [name, values] of Object.entries(result.states)){
        final[name] = values[values.length - 1];
    }
    return final;
}
function getMax(result, name) {
    for (const source of [
        result.states,
        result.controls,
        result.outputs
    ]){
        if (name in source) {
            return Math.max(...source[name]);
        }
    }
    return null;
}
function getMin(result, name) {
    for (const source of [
        result.states,
        result.controls,
        result.outputs
    ]){
        if (name in source) {
            return Math.min(...source[name]);
        }
    }
    return null;
}
function getMean(result, name) {
    for (const source of [
        result.states,
        result.controls,
        result.outputs
    ]){
        if (name in source) {
            const arr = source[name];
            return arr.reduce((a, b)=>a + b, 0) / arr.length;
        }
    }
    return null;
}
function sliceResult(result, tStart, tEnd) {
    const indices = [];
    for(let i = 0; i < result.time.length; i++){
        if (result.time[i] >= tStart && result.time[i] <= tEnd) {
            indices.push(i);
        }
    }
    const sliceArray = (arr)=>indices.map((i)=>arr[i]);
    return {
        time: sliceArray(result.time),
        states: Object.fromEntries(Object.entries(result.states).map(([k, v])=>[
                k,
                sliceArray(v)
            ])),
        controls: Object.fromEntries(Object.entries(result.controls).map(([k, v])=>[
                k,
                sliceArray(v)
            ])),
        outputs: Object.fromEntries(Object.entries(result.outputs).map(([k, v])=>[
                k,
                sliceArray(v)
            ])),
        metadata: {
            ...result.metadata
        }
    };
}
function resampleResult(result, dt) {
    const newTime = [];
    for(let t = result.time[0]; t <= result.time[result.time.length - 1]; t += dt){
        newTime.push(t);
    }
    const interpArray = (arr)=>newTime.map((t)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$math$2f$interpolate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["interp"])(t, result.time, arr));
    return {
        time: newTime,
        states: Object.fromEntries(Object.entries(result.states).map(([k, v])=>[
                k,
                interpArray(v)
            ])),
        controls: Object.fromEntries(Object.entries(result.controls).map(([k, v])=>[
                k,
                interpArray(v)
            ])),
        outputs: Object.fromEntries(Object.entries(result.outputs).map(([k, v])=>[
                k,
                interpArray(v)
            ])),
        metadata: {
            ...result.metadata
        }
    };
}
function summarizeResult(result) {
    const lines = [
        'Simulation Results',
        `  Duration: ${getDuration(result).toFixed(1)} s (${getNumPoints(result)} points)`,
        `  States: ${Object.keys(result.states).join(', ')}`,
        `  Controls: ${Object.keys(result.controls).join(', ')}`,
        `  Outputs: ${Object.keys(result.outputs).join(', ')}`
    ];
    const v = getVelocity(result);
    if (v) {
        const vKmh = v.map((val)=>val * 3.6);
        lines.push(`  Velocity: ${vKmh[0].toFixed(1)} -> ${vKmh[vKmh.length - 1].toFixed(1)} km/h ` + `(max ${Math.max(...vKmh).toFixed(1)} km/h)`);
    }
    const soc = getSoc(result);
    if (soc) {
        lines.push(`  SOC: ${(soc[0] * 100).toFixed(1)}% -> ${(soc[soc.length - 1] * 100).toFixed(1)}%`);
    }
    const fuel = getFuelTotal(result);
    if (fuel !== null) {
        lines.push(`  Fuel consumed: ${fuel.toFixed(2)} kg`);
    }
    return lines.join('\n');
}
}),
"[project]/packages/drivetrain-sim/src/simulation/integrator.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * ODE integration utilities.
 *
 * Provides simple numerical integrators for drivetrain simulation.
 * For production use with stiff problems, consider using odex.js.
 */ /**
 * Dynamics function signature.
 */ __turbopack_context__.s([
    "eulerStep",
    ()=>eulerStep,
    "integrateFixed",
    ()=>integrateFixed,
    "rk45Step",
    ()=>rk45Step,
    "rk4Step",
    ()=>rk4Step,
    "solveIVP",
    ()=>solveIVP
]);
function eulerStep(f, t, x, h) {
    const dx = f(t, x);
    return x.map((xi, i)=>xi + h * dx[i]);
}
function rk4Step(f, t, x, h) {
    const k1 = f(t, x);
    const k2 = f(t + h / 2, x.map((xi, i)=>xi + h / 2 * k1[i]));
    const k3 = f(t + h / 2, x.map((xi, i)=>xi + h / 2 * k2[i]));
    const k4 = f(t + h, x.map((xi, i)=>xi + h * k3[i]));
    return x.map((xi, i)=>xi + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
function rk45Step(f, t, x, h) {
    // Butcher tableau coefficients for RK45
    const k1 = f(t, x);
    const k2 = f(t + h / 4, x.map((xi, i)=>xi + h / 4 * k1[i]));
    const k3 = f(t + 3 * h / 8, x.map((xi, i)=>xi + 3 * h / 32 * k1[i] + 9 * h / 32 * k2[i]));
    const k4 = f(t + 12 * h / 13, x.map((xi, i)=>xi + 1932 * h / 2197 * k1[i] - 7200 * h / 2197 * k2[i] + 7296 * h / 2197 * k3[i]));
    const k5 = f(t + h, x.map((xi, i)=>xi + 439 * h / 216 * k1[i] - 8 * h * k2[i] + 3680 * h / 513 * k3[i] - 845 * h / 4104 * k4[i]));
    const k6 = f(t + h / 2, x.map((xi, i)=>xi - 8 * h / 27 * k1[i] + 2 * h * k2[i] - 3544 * h / 2565 * k3[i] + 1859 * h / 4104 * k4[i] - 11 * h / 40 * k5[i]));
    // Fifth-order solution
    const xNew = x.map((xi, i)=>xi + h * (16 / 135 * k1[i] + 6656 / 12825 * k3[i] + 28561 / 56430 * k4[i] - 9 / 50 * k5[i] + 2 / 55 * k6[i]));
    // Fourth-order solution for error estimation
    const x4 = x.map((xi, i)=>xi + h * (25 / 216 * k1[i] + 1408 / 2565 * k3[i] + 2197 / 4104 * k4[i] - 1 / 5 * k5[i]));
    // Error estimate (max norm)
    let error = 0;
    for(let i = 0; i < x.length; i++){
        error = Math.max(error, Math.abs(xNew[i] - x4[i]));
    }
    return {
        xNew,
        error
    };
}
function solveIVP(f, tSpan, x0, options = {}) {
    const { method = 'RK4', tEval, rtol = 1e-6, atol = 1e-8, maxStep = 0.01 } = options;
    const [tStart, tEnd] = tSpan;
    let t = tStart;
    let x = [
        ...x0
    ];
    let nfev = 0;
    // Store results at evaluation points or at step points
    const outputTimes = tEval ?? [];
    const useOutputTimes = outputTimes.length > 0;
    let outputIdx = 0;
    const tResult = [];
    const yResult = x0.map(()=>[]);
    // Helper to record state
    const recordState = (time, state)=>{
        tResult.push(time);
        for(let i = 0; i < state.length; i++){
            yResult[i].push(state[i]);
        }
    };
    // Record initial state
    if (!useOutputTimes || outputTimes.length > 0 && outputTimes[0] <= tStart) {
        recordState(t, x);
        if (useOutputTimes) outputIdx++;
    }
    // Wrapped dynamics that counts evaluations
    const wrappedF = (time, state)=>{
        nfev++;
        return f(time, state);
    };
    // Integration loop
    const h = maxStep ?? 0.01;
    let stepFn;
    switch(method){
        case 'Euler':
            stepFn = eulerStep;
            break;
        case 'RK45':
        case 'RK4':
        default:
            stepFn = rk4Step;
            break;
    }
    try {
        while(t < tEnd){
            // Determine step size (don't overshoot tEnd or next output time)
            let dt = h;
            if (t + dt > tEnd) {
                dt = tEnd - t;
            }
            if (useOutputTimes && outputIdx < outputTimes.length && t + dt > outputTimes[outputIdx]) {
                dt = outputTimes[outputIdx] - t;
            }
            // Take a step
            x = stepFn(wrappedF, t, x, dt);
            t += dt;
            // Record at output times
            if (useOutputTimes) {
                while(outputIdx < outputTimes.length && Math.abs(t - outputTimes[outputIdx]) < 1e-12){
                    recordState(t, x);
                    outputIdx++;
                }
            } else {
                recordState(t, x);
            }
        }
        return {
            t: tResult,
            y: yResult,
            success: true,
            nfev
        };
    } catch (error) {
        return {
            t: tResult,
            y: yResult,
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
            nfev
        };
    }
}
function integrateFixed(f, tEval, x0, method = 'RK4') {
    const stepFn = method === 'Euler' ? eulerStep : rk4Step;
    let nfev = 0;
    const wrappedF = (t, x)=>{
        nfev++;
        return f(t, x);
    };
    const yResult = x0.map(()=>[]);
    let x = [
        ...x0
    ];
    // Record initial state
    for(let i = 0; i < x.length; i++){
        yResult[i].push(x[i]);
    }
    try {
        for(let k = 1; k < tEval.length; k++){
            const dt = tEval[k] - tEval[k - 1];
            x = stepFn(wrappedF, tEval[k - 1], x, dt);
            for(let i = 0; i < x.length; i++){
                yResult[i].push(x[i]);
            }
        }
        return {
            t: tEval,
            y: yResult,
            success: true,
            nfev
        };
    } catch (error) {
        return {
            t: tEval,
            y: yResult,
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
            nfev
        };
    }
}
}),
"[project]/packages/drivetrain-sim/src/simulation/simulator.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Drivetrain simulator with ODE integration.
 */ __turbopack_context__.s([
    "DrivetrainSimulator",
    ()=>DrivetrainSimulator,
    "simulate",
    ()=>simulate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$math$2f$interpolate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/math/interpolate.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/simulation/config.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$integrator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/simulation/integrator.ts [app-ssr] (ecmascript)");
;
;
;
class DrivetrainSimulator {
    drivetrain;
    _controlLog = [];
    _gradeLog = [];
    constructor(drivetrain){
        this.drivetrain = drivetrain;
    }
    /**
   * Run a time-domain simulation.
   *
   * @param x0 - Initial state {state_name: value}
   * @param controller - Control function or controller object
   * @param gradeProfile - Road grade as constant or function of time
   * @param config - Simulation configuration
   * @returns SimulationResult with all time series data
   */ simulate(x0, controller, gradeProfile = 0.0, config = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DEFAULT_CONFIG"]) {
        this._controlLog = [];
        this._gradeLog = [];
        // Convert initial state to array
        const x0Arr = this.drivetrain.stateToArray(x0);
        // Wrap grade profile as function
        const gradeFn = typeof gradeProfile === 'function' ? gradeProfile : ()=>gradeProfile;
        // Wrap controller
        const controlFn = 'compute' in controller ? (t, state, grade)=>controller.compute(state, grade) : controller;
        // Define dynamics wrapper for ODE solver
        const dynamicsWrapper = (t, x)=>{
            // Get current state as dict
            const state = this.drivetrain.arrayToState(x);
            // Get grade
            const grade = gradeFn(t);
            // Get control inputs
            const control = controlFn(t, state, grade);
            // Log for post-processing
            this._controlLog.push([
                t,
                {
                    ...control
                }
            ]);
            this._gradeLog.push([
                t,
                grade
            ]);
            // Compute dynamics
            return this.drivetrain.dynamics(t, x, control, {
                grade
            });
        };
        // Set up output time points
        const tEval = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getOutputTimes"])(config);
        // Run ODE integration with proper sub-stepping
        const sol = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$integrator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["solveIVP"])(dynamicsWrapper, [
            config.tStart,
            config.tEnd
        ], x0Arr, {
            method: config.method === 'RK45' ? 'RK45' : 'RK4',
            tEval,
            rtol: config.rtol,
            atol: config.atol,
            maxStep: config.maxStep ?? 0.005
        });
        if (!sol.success) {
            throw new Error(`ODE integration failed: ${sol.message}`);
        }
        // Build result
        return this._buildResult(sol, config);
    }
    /**
   * Run simulation with progress callback (for UI updates).
   * Uses internal sub-stepping for accuracy (similar to scipy's adaptive stepping).
   */ async simulateWithProgress(x0, controller, gradeProfile = 0.0, config = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DEFAULT_CONFIG"], onProgress) {
        this._controlLog = [];
        this._gradeLog = [];
        const x0Arr = this.drivetrain.stateToArray(x0);
        const gradeFn = typeof gradeProfile === 'function' ? gradeProfile : ()=>gradeProfile;
        const controlFn = 'compute' in controller ? (t, state, grade)=>controller.compute(state, grade) : controller;
        const tEval = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getOutputTimes"])(config);
        const totalSteps = tEval.length - 1;
        // Internal step size for accuracy (similar to scipy's adaptive stepping)
        const maxStep = config.maxStep ?? 0.005; // 5ms default for good accuracy
        // Manual integration with progress updates
        const yResult = x0Arr.map(()=>[]);
        let x = [
            ...x0Arr
        ];
        let nfev = 0;
        // Record initial state
        for(let i = 0; i < x.length; i++){
            yResult[i].push(x[i]);
        }
        // Helper for a single RK4 step
        const rk4Step = (t, state, h, ctrl, grade)=>{
            const k1 = this.drivetrain.dynamics(t, state, ctrl, {
                grade
            });
            nfev++;
            const k2 = this.drivetrain.dynamics(t + h / 2, state.map((xi, i)=>xi + h / 2 * k1[i]), ctrl, {
                grade
            });
            nfev++;
            const k3 = this.drivetrain.dynamics(t + h / 2, state.map((xi, i)=>xi + h / 2 * k2[i]), ctrl, {
                grade
            });
            nfev++;
            const k4 = this.drivetrain.dynamics(t + h, state.map((xi, i)=>xi + h * k3[i]), ctrl, {
                grade
            });
            nfev++;
            return state.map((xi, i)=>xi + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
        };
        for(let k = 1; k < tEval.length; k++){
            const tStart = tEval[k - 1];
            const tEnd = tEval[k];
            // Sub-step through this interval for accuracy
            let t = tStart;
            while(t < tEnd - 1e-12){
                // Determine step size (don't overshoot)
                const h = Math.min(maxStep, tEnd - t);
                // Get current state dict and control at this sub-step time
                const stateDict = this.drivetrain.arrayToState(x);
                const grade = gradeFn(t);
                const control = controlFn(t, stateDict, grade);
                // Only log at output interval boundaries (not every sub-step)
                if (Math.abs(t - tStart) < 1e-12) {
                    this._controlLog.push([
                        t,
                        {
                            ...control
                        }
                    ]);
                    this._gradeLog.push([
                        t,
                        grade
                    ]);
                }
                // RK4 step
                x = rk4Step(t, x, h, control, grade);
                t += h;
            }
            // Record state at output time
            for(let i = 0; i < x.length; i++){
                yResult[i].push(x[i]);
            }
            // Report progress
            if (onProgress && k % 10 === 0) {
                onProgress(k / totalSteps);
                // Yield to allow UI updates
                await new Promise((resolve)=>setTimeout(resolve, 0));
            }
        }
        if (onProgress) {
            onProgress(1);
        }
        const sol = {
            t: tEval,
            y: yResult,
            success: true,
            nfev
        };
        return this._buildResult(sol, config);
    }
    _buildResult(sol, config) {
        const time = sol.t;
        const nPoints = time.length;
        // Extract states
        const states = {};
        for(let i = 0; i < this.drivetrain.stateNames.length; i++){
            states[this.drivetrain.stateNames[i]] = sol.y[i];
        }
        // Interpolate control log to output times
        const controls = this._interpolateControls(time);
        // Compute derived outputs
        const outputs = this._computeOutputs(time, sol.y, controls);
        // Metadata
        const metadata = {
            solver_method: config.method,
            n_function_evals: sol.nfev,
            drivetrain_type: 'Drivetrain',
            components: Array.from(this.drivetrain.topology.components.keys())
        };
        return {
            time,
            states,
            controls,
            outputs,
            metadata
        };
    }
    _interpolateControls(time) {
        if (this._controlLog.length === 0) {
            return {};
        }
        // Get all control keys
        const allKeys = new Set();
        for (const [, ctrl] of this._controlLog){
            for (const key of Object.keys(ctrl)){
                allKeys.add(key);
            }
        }
        // Build time series for each control
        const logTimes = this._controlLog.map(([t])=>t);
        const controls = {};
        for (const key of allKeys){
            const values = this._controlLog.map(([, ctrl])=>ctrl[key] ?? 0);
            controls[key] = time.map((t)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$math$2f$interpolate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["interp"])(t, logTimes, values));
        }
        return controls;
    }
    _computeOutputs(time, y, controls) {
        const outputs = {};
        const nPoints = time.length;
        // Velocity
        const velocities = [];
        for(let i = 0; i < nPoints; i++){
            const state = y.map((arr)=>arr[i]);
            velocities.push(this.drivetrain.getVelocity(state));
        }
        outputs.velocity = velocities;
        // Grade (from log)
        if (this._gradeLog.length > 0) {
            const logTimes = this._gradeLog.map(([t])=>t);
            const grades = this._gradeLog.map(([, g])=>g);
            outputs.grade = time.map((t)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$math$2f$interpolate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["interp"])(t, logTimes, grades));
        }
        // Power calculations
        Object.assign(outputs, this._computePowerOutputs(time, y, controls));
        return outputs;
    }
    _computePowerOutputs(time, y, controls) {
        const outputs = {};
        const nPoints = time.length;
        const components = this.drivetrain.topology.components;
        // Engine power
        for (const [compName, component] of components){
            if (component.constructor.name.includes('Engine')) {
                const tKey = `T_${compName}`;
                if (tKey in controls) {
                    const speedKey = `${compName}.shaft`;
                    const omega = [];
                    for(let i = 0; i < nPoints; i++){
                        const state = y.map((arr)=>arr[i]);
                        const allSpeeds = this.drivetrain.getAllSpeeds(state);
                        omega.push(allSpeeds[speedKey] ?? 0);
                    }
                    const torque = controls[tKey];
                    const power = torque.map((t, i)=>t * omega[i]);
                    outputs[`P_${compName}`] = power;
                    // Fuel rate
                    if ('getFuelRate' in component) {
                        const fuelRate = [];
                        for(let i = 0; i < nPoints; i++){
                            fuelRate.push(component.getFuelRate(torque[i], omega[i]));
                        }
                        outputs.fuel_rate = fuelRate;
                    }
                }
            }
        }
        // Motor power
        for (const [compName, component] of components){
            if (component.constructor.name.includes('Motor')) {
                const tKey = `T_${compName}`;
                if (tKey in controls) {
                    const speedKey = `${compName}.shaft`;
                    const omega = [];
                    for(let i = 0; i < nPoints; i++){
                        const state = y.map((arr)=>arr[i]);
                        const allSpeeds = this.drivetrain.getAllSpeeds(state);
                        omega.push(allSpeeds[speedKey] ?? 0);
                    }
                    const torque = controls[tKey];
                    const pMech = torque.map((t, i)=>t * omega[i]);
                    outputs[`P_${compName}_mech`] = pMech;
                    // Electrical power
                    if ('getElectricalPower' in component) {
                        const pElec = [];
                        for(let i = 0; i < nPoints; i++){
                            pElec.push(component.getElectricalPower(torque[i], omega[i]));
                        }
                        outputs[`P_${compName}_elec`] = pElec;
                    }
                }
            }
        }
        return outputs;
    }
}
function simulate(drivetrain, x0, controller, gradeProfile = 0.0, config = __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DEFAULT_CONFIG"]) {
    const simulator = new DrivetrainSimulator(drivetrain);
    return simulator.simulate(x0, controller, gradeProfile, config);
}
}),
"[project]/packages/drivetrain-sim/src/simulation/index.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/**
 * Simulation module exports.
 */ __turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/simulation/config.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/simulation/result.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$integrator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/simulation/integrator.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$simulator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/simulation/simulator.ts [app-ssr] (ecmascript)");
;
;
;
;
}),
"[project]/packages/drivetrain-sim/src/control/base.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Base controller class for drivetrains.
 */ __turbopack_context__.s([
    "DrivetrainController",
    ()=>DrivetrainController
]);
class DrivetrainController {
    drivetrain;
    _targetVelocity = null;
    constructor(drivetrain){
        this.drivetrain = drivetrain;
    }
    /** Target velocity [m/s]. */ get targetVelocity() {
        return this._targetVelocity;
    }
    set targetVelocity(value) {
        this._targetVelocity = value;
    }
    /**
   * Reset controller state (for stateful controllers).
   */ reset() {
    // Override in subclass if needed
    }
    /**
   * Get current vehicle velocity from state.
   *
   * @param state - Current state dict
   * @returns Velocity [m/s]
   */ getVelocity(state) {
        const x = this.drivetrain.stateToArray(state);
        return this.drivetrain.getVelocity(x);
    }
}
}),
"[project]/packages/drivetrain-sim/src/control/conventional.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Controller for conventional diesel drivetrains.
 */ __turbopack_context__.s([
    "ConventionalDieselController",
    ()=>ConventionalDieselController,
    "createShiftSchedule",
    ()=>createShiftSchedule
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$control$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/control/base.ts [app-ssr] (ecmascript)");
;
function createShiftSchedule(ratios, engineRpmUpshift = 1500.0, engineRpmDownshift = 1000.0, wheelRadius = 1.78, finalDrive = 16.0) {
    const omegaUp = engineRpmUpshift * Math.PI / 30.0;
    const omegaDown = engineRpmDownshift * Math.PI / 30.0;
    const upshiftSpeeds = [];
    const downshiftSpeeds = [];
    // Speed at which to upshift from gear i to i+1
    for(let i = 0; i < ratios.length - 1; i++){
        const ratio = ratios[i];
        const vUp = omegaUp * wheelRadius / (ratio * finalDrive);
        upshiftSpeeds.push(vUp);
    }
    // Speed at which to downshift from gear i to i-1
    for(let i = 1; i < ratios.length; i++){
        const ratio = ratios[i];
        const vDown = omegaDown * wheelRadius / (ratio * finalDrive);
        downshiftSpeeds.push(vDown);
    }
    return {
        upshiftSpeeds,
        downshiftSpeeds,
        hysteresis: 1.0
    };
}
class ConventionalDieselController extends __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$control$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DrivetrainController"] {
    engineName;
    gearboxName;
    Kp;
    shiftSchedule;
    _currentGear = 0;
    _engine;
    _gearbox;
    constructor(drivetrain, engineName = 'engine', gearboxName = 'gearbox', Kp = 50000.0, shiftSchedule){
        super(drivetrain);
        this.engineName = engineName;
        this.gearboxName = gearboxName;
        this.Kp = Kp;
        // Get component references
        this._engine = drivetrain.getComponent(engineName);
        this._gearbox = drivetrain.getComponent(gearboxName);
        // Create shift schedule if not provided
        if (shiftSchedule) {
            this.shiftSchedule = shiftSchedule;
        } else {
            this._createDefaultSchedule();
        }
    }
    _createDefaultSchedule() {
        const ratios = this._gearbox.params.ratios;
        // Find vehicle component for wheel radius
        let wheelRadius = 1.78;
        let finalDrive = 16.0;
        for (const comp of this.drivetrain.topology.components.values()){
            if ('params' in comp && 'rWheel' in comp.params) {
                wheelRadius = comp.params.rWheel;
            }
            if (comp.name.toLowerCase().includes('final') && 'currentRatio' in comp) {
                finalDrive = comp.currentRatio;
            }
        }
        this.shiftSchedule = createShiftSchedule(ratios, 1500.0, 1000.0, wheelRadius, finalDrive);
    }
    compute(state, grade) {
        // Get current velocity
        const velocity = this.getVelocity(state);
        // Get target velocity
        const vTarget = this._targetVelocity ?? 10.0;
        // Gear selection
        const gear = this._selectGear(velocity, grade);
        this._currentGear = gear;
        // Engine torque (proportional speed control)
        const vError = vTarget - velocity;
        const tDemand = this.Kp * vError;
        // Get engine torque after clipping
        const tEngine = this._computeEngineTorque(state, tDemand);
        return {
            [`T_${this.engineName}`]: tEngine,
            [`gear_${this.gearboxName}`]: gear
        };
    }
    _selectGear(velocity, grade) {
        let gear = this._currentGear;
        const nGears = this._gearbox.nGears;
        // Consider grade in shift decisions
        const gradeFactor = 1.0 - grade * 5.0; // Lower shift points on grades
        // Check for upshift
        if (gear < nGears - 1) {
            const upshiftSpeed = this.shiftSchedule.upshiftSpeeds[gear] * gradeFactor;
            if (velocity > upshiftSpeed + this.shiftSchedule.hysteresis) {
                gear = gear + 1;
            }
        }
        // Check for downshift
        if (gear > 0) {
            const downshiftSpeed = this.shiftSchedule.downshiftSpeeds[gear - 1] * gradeFactor;
            if (velocity < downshiftSpeed - this.shiftSchedule.hysteresis) {
                gear = gear - 1;
            }
        }
        return gear;
    }
    _computeEngineTorque(state, tDemand) {
        // Get engine speed from state
        const engineSpeedKey = `${this.engineName}.shaft`;
        let omegaE = 0.0;
        // Look for engine speed in state
        for (const [key, value] of Object.entries(state)){
            if (key.includes(engineSpeedKey) || key.includes(this.engineName)) {
                omegaE = Math.abs(value);
                break;
            }
        }
        // If not found, estimate from vehicle speed
        if (omegaE < 1.0) {
            const velocity = this.getVelocity(state);
            const gearRatio = this._gearbox.getRatio(this._currentGear);
            const finalDrive = 16.0;
            const wheelRadius = 1.78;
            const omegaWheel = velocity / wheelRadius;
            omegaE = omegaWheel * gearRatio * finalDrive;
        }
        // Convert to RPM and clip
        const rpm = omegaE * 30.0 / Math.PI;
        const tClipped = this._engine.clipTorque(rpm, Math.max(0.0, tDemand));
        return tClipped;
    }
    reset() {
        this._currentGear = 0;
    }
}
}),
"[project]/packages/drivetrain-sim/src/control/speed-controller.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Generic speed controller for any drivetrain type.
 */ __turbopack_context__.s([
    "SpeedController",
    ()=>SpeedController
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$control$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/control/base.ts [app-ssr] (ecmascript)");
;
class SpeedController extends __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$control$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DrivetrainController"] {
    Kp;
    Ki;
    allocation;
    _integral = 0;
    _gearboxName = null;
    _currentGear = 0;
    constructor(drivetrain, Kp = 50000.0, Ki = 5000.0, allocation){
        super(drivetrain);
        this.Kp = Kp;
        this.Ki = Ki;
        // Discover actuators if not specified
        if (allocation) {
            this.allocation = allocation;
        } else {
            this._discoverActuators();
        }
        // Find gearbox for gear control
        this._gearboxName = this._findGearbox();
    }
    _discoverActuators() {
        const actuators = [];
        const fractions = [];
        const isEngine = [];
        const components = this.drivetrain.topology.components;
        // Find all engines and motors
        for (const [name, comp] of components){
            const compType = comp.constructor.name;
            if (compType.includes('Engine')) {
                actuators.push(name);
                isEngine.push(true);
            } else if (compType.includes('Motor')) {
                actuators.push(name);
                isEngine.push(false);
            }
        }
        if (actuators.length === 0) {
            throw new Error('No actuators (engines/motors) found in drivetrain');
        }
        // Simple equal allocation
        const n = actuators.length;
        for(let i = 0; i < n; i++){
            fractions.push(1.0 / n);
        }
        this.allocation = {
            actuators,
            fractions,
            isEngine
        };
    }
    _findGearbox() {
        for (const [name, comp] of this.drivetrain.topology.components){
            if (comp.constructor.name.includes('Gearbox') && 'nGears' in comp) {
                if (comp.nGears > 1) {
                    return name;
                }
            }
        }
        return null;
    }
    compute(state, grade) {
        // Get current velocity
        const velocity = this.getVelocity(state);
        // Get target velocity
        const vTarget = this._targetVelocity ?? 10.0;
        // Speed error
        const vError = vTarget - velocity;
        // PI control
        const tDemand = this.Kp * vError + this.Ki * this._integral;
        // Update integral (with anti-windup)
        if (Math.abs(this._integral) < 100.0) {
            this._integral += vError * 0.1; // Assuming ~0.1s between calls
        }
        // Allocate torque among actuators
        const controls = this._allocateTorque(state, tDemand);
        // Add gear control if gearbox exists
        if (this._gearboxName) {
            const gear = this._selectGear(velocity, grade);
            controls[`gear_${this._gearboxName}`] = gear;
            this._currentGear = gear;
        }
        return controls;
    }
    _allocateTorque(state, tDemand) {
        const controls = {};
        for(let i = 0; i < this.allocation.actuators.length; i++){
            const actuator = this.allocation.actuators[i];
            let tAlloc = tDemand * this.allocation.fractions[i];
            // Engines can only provide positive torque
            if (this.allocation.isEngine[i]) {
                tAlloc = Math.max(0.0, tAlloc);
            }
            // Clip to actuator limits
            const component = this.drivetrain.getComponent(actuator);
            if (component && 'clipTorque' in component) {
                // Get actuator speed
                let omega = 0;
                for (const [key, value] of Object.entries(state)){
                    if (key.includes(actuator)) {
                        omega = Math.abs(value);
                        break;
                    }
                }
                const rpm = omega * 30.0 / Math.PI;
                tAlloc = component.clipTorque(rpm, tAlloc);
            }
            controls[`T_${actuator}`] = tAlloc;
        }
        return controls;
    }
    _selectGear(velocity, grade) {
        if (this._gearboxName === null) {
            return 0;
        }
        const gearbox = this.drivetrain.getComponent(this._gearboxName);
        const nGears = gearbox.nGears;
        // Simple speed-based selection
        const vMax = 15.0; // Assumed max speed
        const gearWidth = vMax / nGears;
        let gear = Math.floor(velocity / gearWidth);
        gear = Math.max(0, Math.min(gear, nGears - 1));
        // Stay in lower gear on steep grades
        if (grade > 0.05) {
            gear = Math.max(0, gear - 1);
        }
        if (grade > 0.1) {
            gear = 0;
        }
        return gear;
    }
    reset() {
        this._integral = 0;
        this._currentGear = 0;
    }
}
}),
"[project]/packages/drivetrain-sim/src/control/index.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/**
 * Control module exports.
 */ __turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$control$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/control/base.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$control$2f$conventional$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/control/conventional.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$control$2f$speed$2d$controller$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/control/speed-controller.ts [app-ssr] (ecmascript)");
;
;
;
}),
"[project]/packages/drivetrain-sim/src/index.ts [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/**
 * Drivetrain Simulation Library
 *
 * A TypeScript library for simulating vehicle drivetrains including
 * conventional diesel, hybrid, and eCVT configurations.
 */ // Core exports
__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/index.ts [app-ssr] (ecmascript) <locals>");
// Component exports
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/components/index.ts [app-ssr] (ecmascript) <locals>");
// Math utilities
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$math$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/math/index.ts [app-ssr] (ecmascript) <locals>");
// Simulation exports
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/simulation/index.ts [app-ssr] (ecmascript) <locals>");
// Control exports
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$control$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/control/index.ts [app-ssr] (ecmascript) <locals>");
;
;
;
;
;
}),
"[project]/packages/drivetrain-sim/src/core/index.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Drivetrain",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$drivetrain$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Drivetrain"],
    "DrivetrainComponent",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$component$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DrivetrainComponent"],
    "DrivetrainTopology",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$topology$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DrivetrainTopology"],
    "GearRatioConstraint",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$constraints$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GearRatioConstraint"],
    "PortDirection",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortDirection"],
    "PortType",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PortType"],
    "RigidConnectionConstraint",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$constraints$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RigidConnectionConstraint"],
    "TopologyError",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$topology$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TopologyError"],
    "WillisConstraint",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$constraints$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WillisConstraint"],
    "canConnect",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["canConnect"],
    "electricalPort",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["electricalPort"],
    "mechanicalPort",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mechanicalPort"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/index.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$component$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/component.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$ports$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/ports.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$constraints$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/constraints.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$topology$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/topology.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$drivetrain$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/drivetrain.ts [app-ssr] (ecmascript)");
}),
"[project]/packages/drivetrain-sim/src/components/index.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BatteryComponent",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$battery$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BatteryComponent"],
    "CAT_3516E_PARAMS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$engine$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CAT_3516E_PARAMS"],
    "CAT_793D_BATTERY_PARAMS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$battery$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CAT_793D_BATTERY_PARAMS"],
    "CAT_793D_GOOD_ROAD",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$vehicle$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CAT_793D_GOOD_ROAD"],
    "CAT_793D_PARAMS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$vehicle$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CAT_793D_PARAMS"],
    "CAT_793D_PLANETARY_PARAMS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$planetary$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CAT_793D_PLANETARY_PARAMS"],
    "CAT_793D_POOR_ROAD",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$vehicle$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CAT_793D_POOR_ROAD"],
    "DIESEL_7SPEED_PARAMS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$gearbox$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DIESEL_7SPEED_PARAMS"],
    "ECVT_GEARBOX_PARAMS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$gearbox$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ECVT_GEARBOX_PARAMS"],
    "EV_BATTERY_PARAMS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$battery$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EV_BATTERY_PARAMS"],
    "EngineComponent",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$engine$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EngineComponent"],
    "FinalDriveComponent",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$gearbox$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FinalDriveComponent"],
    "FixedRatioGearComponent",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$gearbox$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FixedRatioGearComponent"],
    "MG1_PARAMS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$motor$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MG1_PARAMS"],
    "MG2_PARAMS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$motor$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MG2_PARAMS"],
    "MotorComponent",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$motor$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MotorComponent"],
    "NSpeedGearboxComponent",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$gearbox$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NSpeedGearboxComponent"],
    "PlanetaryGearComponent",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$planetary$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlanetaryGearComponent"],
    "SERIES_HYBRID_BATTERY_PARAMS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$battery$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SERIES_HYBRID_BATTERY_PARAMS"],
    "SINGLE_SPEED_PARAMS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$gearbox$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SINGLE_SPEED_PARAMS"],
    "VehicleComponent",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$vehicle$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VehicleComponent"],
    "createMG1",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$motor$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createMG1"],
    "createMG2",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$motor$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createMG2"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/components/index.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$engine$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/components/engine.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$motor$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/components/motor.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$gearbox$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/components/gearbox.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$planetary$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/components/planetary.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$battery$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/components/battery.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$vehicle$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/components/vehicle.ts [app-ssr] (ecmascript)");
}),
"[project]/packages/drivetrain-sim/src/simulation/index.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_CONFIG",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DEFAULT_CONFIG"],
    "DrivetrainSimulator",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$simulator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DrivetrainSimulator"],
    "HIGH_FIDELITY_SIM",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HIGH_FIDELITY_SIM"],
    "LONG_SIM",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LONG_SIM"],
    "MEDIUM_SIM",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MEDIUM_SIM"],
    "SHORT_SIM",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SHORT_SIM"],
    "createConfig",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createConfig"],
    "createResult",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createResult"],
    "eulerStep",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$integrator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["eulerStep"],
    "getAverageDt",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAverageDt"],
    "getControl",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getControl"],
    "getDuration",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDuration"],
    "getEnginePower",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getEnginePower"],
    "getFinalState",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getFinalState"],
    "getFuelRate",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getFuelRate"],
    "getFuelTotal",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getFuelTotal"],
    "getMax",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getMax"],
    "getMean",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getMean"],
    "getMin",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getMin"],
    "getNumOutputPoints",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getNumOutputPoints"],
    "getNumPoints",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getNumPoints"],
    "getOutput",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getOutput"],
    "getOutputTimes",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getOutputTimes"],
    "getSoc",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getSoc"],
    "getState",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getState"],
    "getVelocity",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getVelocity"],
    "getVelocityKmh",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getVelocityKmh"],
    "integrateFixed",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$integrator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["integrateFixed"],
    "resampleResult",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resampleResult"],
    "rk45Step",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$integrator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rk45Step"],
    "rk4Step",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$integrator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rk4Step"],
    "simulate",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$simulator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["simulate"],
    "sliceResult",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sliceResult"],
    "solveIVP",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$integrator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["solveIVP"],
    "summarizeResult",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["summarizeResult"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/simulation/index.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/simulation/config.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$result$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/simulation/result.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$integrator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/simulation/integrator.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$simulator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/simulation/simulator.ts [app-ssr] (ecmascript)");
}),
"[project]/packages/drivetrain-sim/src/control/index.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ConventionalDieselController",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$control$2f$conventional$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ConventionalDieselController"],
    "DrivetrainController",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$control$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DrivetrainController"],
    "SpeedController",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$control$2f$speed$2d$controller$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SpeedController"],
    "createShiftSchedule",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$control$2f$conventional$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createShiftSchedule"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$control$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/control/index.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$control$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/control/base.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$control$2f$conventional$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/control/conventional.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$control$2f$speed$2d$controller$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/control/speed-controller.ts [app-ssr] (ecmascript)");
}),
"[project]/apps/gearbox-analyzer/hooks/useSimulation.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useSimulation",
    ()=>useSimulation
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/stores/simulation-store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/index.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/core/index.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/components/index.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/simulation/index.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$control$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/drivetrain-sim/src/control/index.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
/**
 * Port name mapping from React Flow handles to simulation library ports.
 */ const HANDLE_TO_PORT = {
    engine: {
        shaft: "shaft"
    },
    motor: {
        shaft: "shaft",
        "shaft-in": "shaft",
        "shaft-out": "shaft",
        electrical: "electrical"
    },
    gearbox: {
        input: "input",
        output: "output"
    },
    planetary: {
        sun: "sun",
        carrier: "carrier",
        ring: "ring"
    },
    battery: {
        electrical: "electrical"
    },
    vehicle: {
        wheels: "wheels"
    }
};
/**
 * Create a component instance from node data.
 */ function createComponent(nodeData) {
    const { componentType, params } = nodeData;
    try {
        switch(componentType){
            case "engine":
                {
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EngineComponent"]({
                        jEngine: 200,
                        rpmIdle: params.rpmIdle,
                        rpmMax: params.rpmMax,
                        pRated: params.pRated,
                        tPeak: params.tPeak
                    });
                }
            case "motor":
                {
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MotorComponent"]({
                        jRotor: 10,
                        pMax: params.pMax,
                        tMax: params.tMax,
                        rpmMax: params.rpmMax,
                        eta: params.eta
                    });
                }
            case "gearbox":
                {
                    const ratios = params.ratios;
                    const efficiencies = params.efficiencies;
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NSpeedGearboxComponent"]({
                        ratios: ratios,
                        efficiencies: efficiencies,
                        jInput: 50,
                        jOutput: 100
                    });
                }
            case "planetary":
                {
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlanetaryGearComponent"]({
                        zSun: params.zSun,
                        zRing: params.zRing,
                        jSun: 5,
                        jCarrier: 150,
                        jRing: 10
                    });
                }
            case "battery":
                {
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BatteryComponent"]({
                        capacityKwh: params.capacityKwh,
                        vNom: params.vNom,
                        pMaxDischarge: params.pMaxDischarge,
                        pMaxCharge: params.pMaxCharge,
                        socInit: params.socInit
                    });
                }
            case "vehicle":
                {
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$components$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VehicleComponent"]({
                        mEmpty: params.mEmpty,
                        mPayload: params.mPayload,
                        rWheel: params.rWheel,
                        cR: params.cR,
                        rhoAir: 1.225,
                        cD: 0.8,
                        aFrontal: 50
                    });
                }
            default:
                console.warn(`Unknown component type: ${componentType}`);
                return null;
        }
    } catch (error) {
        console.error(`Error creating ${componentType} component:`, error);
        return null;
    }
}
/**
 * Convert React Flow nodes and edges to a DrivetrainTopology.
 */ function buildTopology(nodes, edges) {
    const topology = new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$core$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DrivetrainTopology"]();
    // Add all components
    for (const node of nodes){
        const component = createComponent(node.data);
        if (component) {
            topology.addComponent(node.id, component);
        }
    }
    // Add connections (only mechanical for now)
    for (const edge of edges){
        if (edge.type === "electrical") {
            continue;
        }
        const sourceNode = nodes.find((n)=>n.id === edge.source);
        const targetNode = nodes.find((n)=>n.id === edge.target);
        if (!sourceNode || !targetNode) continue;
        const sourcePortMap = HANDLE_TO_PORT[sourceNode.data.componentType];
        const targetPortMap = HANDLE_TO_PORT[targetNode.data.componentType];
        if (!sourcePortMap || !targetPortMap) continue;
        const sourcePort = sourcePortMap[edge.sourceHandle || ""] || edge.sourceHandle;
        const targetPort = targetPortMap[edge.targetHandle || ""] || edge.targetHandle;
        if (sourcePort && targetPort) {
            try {
                topology.connect(edge.source, sourcePort, edge.target, targetPort);
            } catch (e) {
                console.warn(`Connection failed: ${edge.source}.${sourcePort} -> ${edge.target}.${targetPort}`, e);
            }
        }
    }
    // Set output to vehicle.wheels
    const vehicleNode = nodes.find((n)=>n.data.componentType === "vehicle");
    if (vehicleNode) {
        topology.setOutput(vehicleNode.id, "wheels");
    }
    return topology;
}
/**
 * Compute rimpull curves for the drivetrain.
 *
 * Detects topology type and calculates appropriately:
 * - Diesel: Engine → Gearbox → Vehicle (conventional)
 * - eCVT: Engine + Motors + Planetary → Gearbox → Vehicle
 */ function computeRimpull(nodes, edges) {
    const curves = [];
    // Find key components
    const engineNode = nodes.find((n)=>n.data.componentType === "engine");
    const motorNodes = nodes.filter((n)=>n.data.componentType === "motor");
    const planetaryNode = nodes.find((n)=>n.data.componentType === "planetary");
    const gearboxNode = nodes.find((n)=>n.data.componentType === "gearbox");
    const vehicleNode = nodes.find((n)=>n.data.componentType === "vehicle");
    if (!vehicleNode) {
        return curves;
    }
    const vehicleParams = vehicleNode.data.params;
    const rWheel = vehicleParams.rWheel || 1.78;
    const mTotal = (vehicleParams.mEmpty || 159350) + (vehicleParams.mPayload || 190000);
    const cR = vehicleParams.cR || 0.025;
    // Detect topology type
    const isECVT = planetaryNode && motorNodes.length >= 1;
    if (isECVT && engineNode) {
        // eCVT topology: Engine + Planetary + Motors
        curves.push(...computeECVTRimpull(engineNode, motorNodes, planetaryNode, gearboxNode, vehicleParams, rWheel));
    } else if (engineNode) {
        // Diesel topology: Engine → Gearbox → Vehicle
        curves.push(...computeDieselRimpull(engineNode, gearboxNode, vehicleParams, rWheel));
    } else if (motorNodes.length > 0) {
        // Pure electric: Motor → Gearbox → Vehicle
        curves.push(...computeElectricRimpull(motorNodes, gearboxNode, vehicleParams, rWheel));
    }
    // Add resistance curves
    addResistanceCurves(curves, mTotal, cR);
    return curves;
}
/**
 * Compute rimpull for conventional diesel drivetrain.
 */ function computeDieselRimpull(engineNode, gearboxNode, vehicleParams, rWheel) {
    const curves = [];
    const engineParams = engineNode.data.params;
    // Engine parameters
    const tPeak = engineParams.tPeak || 11220;
    const pRated = engineParams.pRated || 1801000;
    const rpmIdle = engineParams.rpmIdle || 700;
    const rpmMax = engineParams.rpmMax || 1800;
    // Base speed where power limiting begins
    const omegaBase = pRated / tPeak;
    // Final drive ratio (hardcoded for CAT 793D)
    const finalDrive = 16.0;
    const efficiency = 0.92;
    // Get gear ratios
    const gearRatios = gearboxNode ? gearboxNode.data.params.ratios || [
        1.0
    ] : [
        1.0
    ];
    const gearColors = [
        "#ef4444",
        "#f97316",
        "#eab308",
        "#22c55e",
        "#06b6d4",
        "#3b82f6",
        "#8b5cf6"
    ];
    for(let g = 0; g < gearRatios.length; g++){
        const ratio = gearRatios[g];
        const points = [];
        const totalRatio = ratio * finalDrive;
        const vMin = rpmIdle * Math.PI / 30 / totalRatio * rWheel;
        const vMax = rpmMax * Math.PI / 30 / totalRatio * rWheel;
        const numPoints = 50;
        for(let i = 0; i <= numPoints; i++){
            const velocity = vMin + (vMax - vMin) * (i / numPoints);
            const omegaWheel = velocity / rWheel;
            const omegaEngine = omegaWheel * totalRatio;
            let torque;
            if (omegaEngine <= omegaBase) {
                torque = tPeak;
            } else {
                torque = pRated / omegaEngine;
            }
            const force = torque * totalRatio * efficiency / rWheel;
            points.push({
                velocity,
                force,
                gear: g + 1
            });
        }
        curves.push({
            name: `Gear ${g + 1} (${ratio.toFixed(2)}:1)`,
            points,
            color: gearColors[g % gearColors.length]
        });
    }
    return curves;
}
/**
 * Compute rimpull for eCVT (power-split hybrid) drivetrain.
 * Uses Willis equation: ω_sun = (1+ρ)·ω_carrier - ρ·ω_ring
 */ function computeECVTRimpull(engineNode, motorNodes, planetaryNode, gearboxNode, vehicleParams, rWheel) {
    const curves = [];
    // Engine parameters
    const engineParams = engineNode.data.params;
    const rpmEngineMin = engineParams.rpmIdle || 700;
    const rpmEngineMax = engineParams.rpmMax || 1800;
    const tEngineMax = engineParams.tPeak || 11220;
    // Planetary ratio: ρ = Z_ring / Z_sun
    const planetaryParams = planetaryNode.data.params;
    const zSun = planetaryParams.zSun || 30;
    const zRing = planetaryParams.zRing || 90;
    const rho = zRing / zSun; // typically 3.0
    // Motor parameters (find MG1 and MG2)
    // MG1 is typically lower power (reaction motor), MG2 is higher power (traction motor)
    const sortedMotors = [
        ...motorNodes
    ].sort((a, b)=>(a.data.params.pMax || 0) - (b.data.params.pMax || 0));
    const mg1Params = sortedMotors[0]?.data.params || {};
    const mg2Params = sortedMotors[1]?.data.params || sortedMotors[0]?.data.params || {};
    const pMG1Max = mg1Params.pMax || 200000;
    const tMG1Max = mg1Params.tMax || 3000;
    const rpmMG1Max = mg1Params.rpmMax || 6000;
    const pMG2Max = mg2Params.pMax || 350000;
    const tMG2Max = mg2Params.tMax || 2000;
    const rpmMG2Max = mg2Params.rpmMax || 6000;
    const pMG2Boost = mg2Params.pBoost || pMG2Max;
    // Gearbox ratios (2-speed for eCVT)
    const gearRatios = gearboxNode ? gearboxNode.data.params.ratios || [
        5.0,
        0.67
    ] : [
        5.0,
        0.67
    ];
    const gearEfficiencies = gearboxNode ? gearboxNode.data.params.efficiencies || [
        0.97,
        0.97
    ] : [
        0.97,
        0.97
    ];
    // Final drive (typically included in gearbox total ratio for eCVT)
    const finalDrive = 16.0;
    // Speed range (0 to 60 km/h)
    const numPoints = 200;
    const vMax = 60 / 3.6; // 60 km/h in m/s
    const gearColors = [
        "#3b82f6",
        "#ef4444"
    ]; // Blue for low, red for high
    for(let g = 0; g < Math.min(gearRatios.length, 2); g++){
        const gearRatio = gearRatios[g];
        const eta = gearEfficiencies[g] || 0.97;
        const kTotal = gearRatio * finalDrive;
        const points = [];
        for(let i = 1; i <= numPoints; i++){
            const velocity = vMax * i / numPoints;
            // Ring speed from vehicle speed (ring connects to gearbox input)
            const omegaRing = velocity / rWheel * kTotal;
            const rpmRing = omegaRing * 30 / Math.PI;
            // Check MG2 speed limit (MG2 is on ring)
            if (rpmRing > rpmMG2Max) {
                points.push({
                    velocity,
                    force: 0,
                    gear: g + 1
                });
                continue;
            }
            // Optimal engine speed (near peak torque, ~1200 rpm)
            let rpmEngine = 1200;
            let omegaEngine = rpmEngine * Math.PI / 30;
            // MG1 speed from Willis equation: ω_sun = (1+ρ)·ω_carrier - ρ·ω_ring
            // Engine is on carrier, MG1 is on sun
            let omegaMG1 = (1 + rho) * omegaEngine - rho * omegaRing;
            let rpmMG1 = omegaMG1 * 30 / Math.PI;
            // Check MG1 speed limits and adjust engine speed if needed
            if (Math.abs(rpmMG1) > rpmMG1Max) {
                // Limit MG1 speed and recalculate engine speed
                const omegaMG1Limit = (rpmMG1 > 0 ? rpmMG1Max : -rpmMG1Max) * Math.PI / 30;
                omegaEngine = (omegaMG1Limit + rho * omegaRing) / (1 + rho);
                rpmEngine = omegaEngine * 30 / Math.PI;
                omegaMG1 = omegaMG1Limit;
                rpmMG1 = omegaMG1 * 30 / Math.PI;
            }
            // Clamp engine to valid range
            rpmEngine = Math.max(rpmEngineMin, Math.min(rpmEngineMax, rpmEngine));
            omegaEngine = rpmEngine * Math.PI / 30;
            omegaMG1 = (1 + rho) * omegaEngine - rho * omegaRing;
            rpmMG1 = omegaMG1 * 30 / Math.PI;
            // Get max torques
            // Engine max torque (could be power-limited)
            const omegaBase = 1801000 / tEngineMax; // power/torque
            let tEngineAvail = omegaEngine <= omegaBase ? tEngineMax : 1801000 / omegaEngine;
            // MG1 max torque (power-limited at high speed)
            const omegaMG1Base = pMG1Max / tMG1Max;
            const tMG1MaxAtSpeed = Math.abs(omegaMG1) <= omegaMG1Base ? tMG1Max : pMG1Max / Math.abs(omegaMG1);
            // MG2 max torque (with boost)
            const omegaMG2Base = pMG2Boost / tMG2Max;
            const tMG2MaxAtSpeed = omegaRing <= omegaMG2Base ? tMG2Max : pMG2Boost / omegaRing;
            // MG1 must react engine torque: T_MG1 = -T_engine / (1+ρ)
            // So max engine torque is limited by MG1 capacity
            const tEngineLimited = Math.min(tEngineAvail, (1 + rho) * tMG1MaxAtSpeed);
            // MG1 reaction torque
            const tMG1 = -tEngineLimited / (1 + rho);
            // Ring torque from engine path (through planetary)
            // T_ring_from_engine = -ρ × T_MG1 = ρ/(1+ρ) × T_engine
            const tRingFromEngine = -rho * tMG1;
            // Total ring torque = engine contribution + MG2 contribution
            const tRingTotal = tRingFromEngine + tMG2MaxAtSpeed;
            // Wheel torque and rimpull
            const tWheel = tRingTotal * kTotal * eta;
            const force = tWheel / rWheel;
            points.push({
                velocity,
                force: Math.max(0, force),
                gear: g + 1
            });
        }
        const gearName = g === 0 ? "Low Gear" : "High Gear";
        curves.push({
            name: `${gearName} (${gearRatio.toFixed(2)}:1)`,
            points,
            color: gearColors[g]
        });
    }
    return curves;
}
/**
 * Compute rimpull for pure electric drivetrain.
 */ function computeElectricRimpull(motorNodes, gearboxNode, vehicleParams, rWheel) {
    const curves = [];
    // Use the most powerful motor
    const motorNode = motorNodes.reduce((a, b)=>(a.data.params.pMax || 0) > (b.data.params.pMax || 0) ? a : b);
    const motorParams = motorNode.data.params;
    const pMax = motorParams.pMax || 350000;
    const tMax = motorParams.tMax || 3000;
    const rpmMax = motorParams.rpmMax || 6000;
    const eta = motorParams.eta || 0.92;
    const omegaBase = pMax / tMax;
    const finalDrive = 16.0;
    const gearRatios = gearboxNode ? gearboxNode.data.params.ratios || [
        1.0
    ] : [
        1.0
    ];
    const gearColors = [
        "#3b82f6",
        "#22c55e",
        "#f97316"
    ];
    for(let g = 0; g < gearRatios.length; g++){
        const ratio = gearRatios[g];
        const totalRatio = ratio * finalDrive;
        const points = [];
        const vMax = rpmMax * Math.PI / 30 / totalRatio * rWheel;
        const numPoints = 50;
        for(let i = 1; i <= numPoints; i++){
            const velocity = vMax * i / numPoints;
            const omegaWheel = velocity / rWheel;
            const omegaMotor = omegaWheel * totalRatio;
            let torque;
            if (omegaMotor <= omegaBase) {
                torque = tMax;
            } else {
                torque = pMax / omegaMotor;
            }
            const force = torque * totalRatio * eta / rWheel;
            points.push({
                velocity,
                force,
                gear: g + 1
            });
        }
        curves.push({
            name: `Gear ${g + 1} (${ratio.toFixed(2)}:1)`,
            points,
            color: gearColors[g % gearColors.length]
        });
    }
    return curves;
}
/**
 * Add resistance curves (rolling + grade) to the curves array.
 */ function addResistanceCurves(curves, mTotal, cR) {
    const g_accel = 9.81;
    const grades = [
        0,
        0.05,
        0.10,
        0.15
    ];
    const gradeColors = [
        "#555555",
        "#666666",
        "#888888",
        "#aaaaaa"
    ];
    const maxSpeed = 60 / 3.6;
    for(let gi = 0; gi < grades.length; gi++){
        const grade = grades[gi];
        const gradePoints = [];
        for(let i = 0; i <= 30; i++){
            const v = maxSpeed * i / 30;
            const f_rolling = mTotal * g_accel * cR;
            const f_grade = mTotal * g_accel * Math.sin(Math.atan(grade));
            gradePoints.push({
                velocity: v,
                force: f_rolling + f_grade
            });
        }
        const label = grade === 0 ? "Rolling Resistance (0% grade)" : `Resistance (${(grade * 100).toFixed(0)}% grade)`;
        curves.push({
            name: label,
            points: gradePoints,
            color: gradeColors[gi]
        });
    }
}
function useSimulation() {
    const setStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.setStatus);
    const setProgress = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.setProgress);
    const setResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.setResult);
    const setRimpullCurves = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.setRimpullCurves);
    const setError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.setError);
    const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.config);
    const runSimulation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (nodes, edges)=>{
        console.log("useSimulation: runSimulation called");
        setStatus("running");
        setProgress(0);
        setError(null);
        try {
            // Build topology
            console.log("Building topology...");
            const topology = buildTopology(nodes, edges);
            console.log("Topology built:", topology.toString());
            // Compile drivetrain
            console.log("Compiling drivetrain...");
            const drivetrain = topology.build();
            console.log("Drivetrain compiled, states:", drivetrain.stateNames);
            // Create simulator
            console.log("Creating simulator...");
            const simulator = new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$simulation$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DrivetrainSimulator"](drivetrain);
            // Create controller
            console.log("Creating controller...");
            const controller = new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$drivetrain$2d$sim$2f$src$2f$control$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SpeedController"](drivetrain, 50000, 5000);
            controller.targetVelocity = config.targetVelocity;
            console.log("Target velocity:", config.targetVelocity);
            // Initial state (zero velocities)
            const x0 = {};
            for (const name of drivetrain.stateNames){
                x0[name] = 0;
            }
            console.log("Initial state:", x0);
            // Simulation config
            const simConfig = {
                tStart: 0,
                tEnd: config.tEnd,
                dtOutput: config.dtOutput,
                method: "RK4",
                rtol: 1e-6,
                atol: 1e-8,
                maxStep: 0.01
            };
            console.log("Simulation config:", simConfig);
            // Run simulation with progress
            console.log("Starting simulation...");
            const result = await simulator.simulateWithProgress(x0, controller, config.grade, simConfig, (progress)=>{
                setProgress(progress);
            });
            console.log("Simulation complete, points:", result.time.length);
            // Convert to UI format
            const simResult = {
                time: result.time,
                velocity: result.outputs.velocity || [],
                grade: result.outputs.grade || new Array(result.time.length).fill(config.grade),
                fuelRate: result.outputs.fuel_rate,
                enginePower: Object.entries(result.outputs).find(([k])=>k.startsWith("P_engine"))?.[1],
                motorPower: Object.entries(result.outputs).find(([k])=>k.startsWith("P_motor"))?.[1]
            };
            // Check for SOC in states
            for (const [key, values] of Object.entries(result.states)){
                if (key.toLowerCase().includes("soc") || key.toLowerCase().includes("battery")) {
                    simResult.soc = values;
                    break;
                }
            }
            setResult(simResult);
            setStatus("completed");
        } catch (error) {
            console.error("Simulation failed:", error);
            setError(error instanceof Error ? error.message : "Simulation failed");
            setStatus("error");
        }
    }, [
        config,
        setStatus,
        setProgress,
        setResult,
        setError
    ]);
    const calculateRimpull = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((nodes, edges)=>{
        try {
            const curves = computeRimpull(nodes, edges);
            setRimpullCurves(curves);
        } catch (error) {
            console.error("Rimpull calculation failed:", error);
        }
    }, [
        setRimpullCurves
    ]);
    return {
        runSimulation,
        calculateRimpull
    };
}
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[project]/apps/gearbox-analyzer/components/charts/SimulationChart.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SimulationChart",
    ()=>SimulationChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/shared/lib/app-dynamic.js [app-ssr] (ecmascript)");
;
"use client";
;
;
// Dynamically import Plotly to avoid SSR issues
const Plot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(async ()=>{}, {
    loadableGenerated: {
        modules: [
            "[project]/node_modules/react-plotly.js/react-plotly.js [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false
});
function SimulationChart({ time, velocity, grade, fuelRate, enginePower, motorPower }) {
    // Convert velocity to km/h
    const velocityKmh = velocity.map((v)=>v * 3.6);
    // Build traces
    const traces = [
        {
            x: time,
            y: velocityKmh,
            type: "scatter",
            mode: "lines",
            name: "Velocity (km/h)",
            line: {
                color: "#22c55e",
                width: 2
            },
            yaxis: "y"
        }
    ];
    // Add engine power if available
    if (enginePower && enginePower.some((p)=>p !== 0)) {
        const powerKw = enginePower.map((p)=>p / 1000);
        traces.push({
            x: time,
            y: powerKw,
            type: "scatter",
            mode: "lines",
            name: "Engine Power (kW)",
            line: {
                color: "#f97316",
                width: 2
            },
            yaxis: "y2"
        });
    }
    // Add motor power if available
    if (motorPower && motorPower.some((p)=>p !== 0)) {
        const powerKw = motorPower.map((p)=>p / 1000);
        traces.push({
            x: time,
            y: powerKw,
            type: "scatter",
            mode: "lines",
            name: "Motor Power (kW)",
            line: {
                color: "#3b82f6",
                width: 2,
                dash: "dash"
            },
            yaxis: "y2"
        });
    }
    // Add fuel rate if available
    if (fuelRate && fuelRate.some((f)=>f !== 0)) {
        const fuelKgH = fuelRate.map((f)=>f * 3600);
        traces.push({
            x: time,
            y: fuelKgH,
            type: "scatter",
            mode: "lines",
            name: "Fuel Rate (kg/h)",
            line: {
                color: "#ef4444",
                width: 1.5,
                dash: "dot"
            },
            yaxis: "y3"
        });
    }
    const layout = {
        title: "",
        autosize: true,
        margin: {
            t: 20,
            r: 80,
            b: 50,
            l: 60
        },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: {
            color: "#888"
        },
        xaxis: {
            title: "Time (s)",
            gridcolor: "#333",
            zerolinecolor: "#444"
        },
        yaxis: {
            title: "Velocity (km/h)",
            titlefont: {
                color: "#22c55e"
            },
            tickfont: {
                color: "#22c55e"
            },
            gridcolor: "#333",
            zerolinecolor: "#444",
            side: "left"
        },
        yaxis2: {
            title: "Power (kW)",
            titlefont: {
                color: "#f97316"
            },
            tickfont: {
                color: "#f97316"
            },
            overlaying: "y",
            side: "right",
            showgrid: false
        },
        yaxis3: {
            title: "Fuel (kg/h)",
            titlefont: {
                color: "#ef4444"
            },
            tickfont: {
                color: "#ef4444"
            },
            overlaying: "y",
            side: "right",
            position: 0.95,
            showgrid: false
        },
        legend: {
            x: 0,
            y: 1.1,
            orientation: "h",
            bgcolor: "transparent"
        },
        showlegend: true
    };
    const config = {
        displayModeBar: false,
        responsive: true
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full h-full min-h-[180px]",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Plot, {
            data: traces,
            layout: layout,
            config: config,
            useResizeHandler: true,
            style: {
                width: "100%",
                height: "100%"
            }
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/charts/SimulationChart.tsx",
            lineNumber: 136,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/charts/SimulationChart.tsx",
        lineNumber: 135,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/gearbox-analyzer/components/charts/RimpullChart.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RimpullChart",
    ()=>RimpullChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/shared/lib/app-dynamic.js [app-ssr] (ecmascript)");
;
"use client";
;
;
// Dynamically import Plotly to avoid SSR issues
const Plot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(async ()=>{}, {
    loadableGenerated: {
        modules: [
            "[project]/node_modules/react-plotly.js/react-plotly.js [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false
});
function RimpullChart({ curves }) {
    if (curves.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full h-full flex items-center justify-center text-muted",
            children: "No rimpull data available"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/charts/RimpullChart.tsx",
            lineNumber: 16,
            columnNumber: 7
        }, this);
    }
    // Convert to Plotly traces
    const traces = curves.map((curve)=>({
            x: curve.points.map((p)=>p.velocity * 3.6),
            y: curve.points.map((p)=>p.force / 1000),
            type: "scatter",
            mode: "lines",
            name: curve.name,
            line: {
                color: curve.color,
                width: curve.name.includes("Resistance") ? 1.5 : 2.5,
                dash: curve.name.includes("Resistance") ? "dash" : "solid"
            },
            fill: curve.name.includes("Resistance") ? undefined : "tozeroy",
            fillcolor: curve.name.includes("Resistance") ? undefined : `${curve.color}15`
        }));
    const layout = {
        title: "",
        autosize: true,
        margin: {
            t: 20,
            r: 40,
            b: 50,
            l: 60
        },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: {
            color: "#888"
        },
        xaxis: {
            title: "Speed (km/h)",
            gridcolor: "#333",
            zerolinecolor: "#444",
            range: [
                0,
                60
            ]
        },
        yaxis: {
            title: "Tractive Force (kN)",
            gridcolor: "#333",
            zerolinecolor: "#444",
            range: [
                0,
                null
            ]
        },
        legend: {
            x: 1,
            xanchor: "right",
            y: 1,
            bgcolor: "rgba(0,0,0,0.5)"
        },
        showlegend: true,
        hovermode: "closest"
    };
    const config = {
        displayModeBar: false,
        responsive: true
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full h-full min-h-[180px]",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Plot, {
            data: traces,
            layout: layout,
            config: config,
            useResizeHandler: true,
            style: {
                width: "100%",
                height: "100%"
            }
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/charts/RimpullChart.tsx",
            lineNumber: 76,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/charts/RimpullChart.tsx",
        lineNumber: 75,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SimulationPanel",
    ()=>SimulationPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/play.js [app-ssr] (ecmascript) <export default as Play>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rotate-ccw.js [app-ssr] (ecmascript) <export default as RotateCcw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-ssr] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-ssr] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/input.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/label.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/tabs.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/stores/drivetrain-store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/stores/simulation-store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$hooks$2f$useSimulation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/hooks/useSimulation.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$charts$2f$SimulationChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/charts/SimulationChart.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$charts$2f$RimpullChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/charts/RimpullChart.tsx [app-ssr] (ecmascript)");
"use client";
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
;
function SimulationPanel() {
    const nodes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.nodes);
    const edges = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.edges);
    const validateTopology = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.validateTopology);
    const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.config);
    const setConfig = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.setConfig);
    const status = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.status);
    const progress = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.progress);
    const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.result);
    const error = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.error);
    const rimpullCurves = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.rimpullCurves);
    const reset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.reset);
    const { runSimulation, calculateRimpull } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$hooks$2f$useSimulation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulation"])();
    // Calculate rimpull when nodes/edges change
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (nodes.length > 0) {
            calculateRimpull(nodes, edges);
        }
    }, [
        nodes,
        edges,
        calculateRimpull
    ]);
    const handleRunSimulation = async ()=>{
        console.log("Run simulation clicked, nodes:", nodes.length, "edges:", edges.length);
        if (nodes.length === 0) {
            alert("No components in the topology. Load a preset or add components first.");
            return;
        }
        const validation = validateTopology();
        console.log("Validation result:", validation);
        if (!validation.isValid) {
            alert("Invalid topology:\n" + validation.errors.join("\n"));
            return;
        }
        try {
            console.log("Starting simulation...");
            await runSimulation(nodes, edges);
            console.log("Simulation completed");
        } catch (error) {
            console.error("Simulation error:", error);
            alert("Simulation failed: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };
    const handleStop = ()=>{
        reset();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-64 bg-dark border-t border-subtle p-4 overflow-hidden",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Tabs"], {
            defaultValue: "config",
            className: "h-full flex flex-col",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between mb-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TabsList"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TabsTrigger"], {
                                    value: "config",
                                    children: "Configuration"
                                }, void 0, false, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 73,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TabsTrigger"], {
                                    value: "results",
                                    children: "Results"
                                }, void 0, false, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 74,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TabsTrigger"], {
                                    value: "rimpull",
                                    children: "Rimpull"
                                }, void 0, false, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 75,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                            lineNumber: 72,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2",
                            children: [
                                status === "running" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2 text-sm text-muted",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                            className: "h-4 w-4 animate-spin text-accent"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 81,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "h-2 w-32 bg-subtle rounded-full overflow-hidden",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "h-full bg-accent transition-all",
                                                style: {
                                                    width: `${progress * 100}%`
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                                lineNumber: 83,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 82,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: [
                                                Math.round(progress * 100),
                                                "%"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 88,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 80,
                                    columnNumber: 15
                                }, this),
                                status === "error" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-1 text-sm text-red-500",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                            className: "h-4 w-4"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 94,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: "Error"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 95,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 93,
                                    columnNumber: 15
                                }, this),
                                status !== "running" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                    type: "button",
                                    variant: "accent",
                                    size: "sm",
                                    onClick: handleRunSimulation,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__["Play"], {
                                            className: "h-4 w-4 mr-1"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 106,
                                            columnNumber: 17
                                        }, this),
                                        "Run Simulation"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 100,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                    type: "button",
                                    variant: "destructive",
                                    size: "sm",
                                    onClick: handleStop,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                            className: "h-4 w-4 mr-1 animate-spin"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 111,
                                            columnNumber: 17
                                        }, this),
                                        "Running..."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 110,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                    type: "button",
                                    variant: "outline",
                                    size: "sm",
                                    onClick: reset,
                                    disabled: status === "running",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                                        className: "h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                        lineNumber: 117,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 116,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                            lineNumber: 78,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                    lineNumber: 71,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TabsContent"], {
                    value: "config",
                    className: "flex-1 overflow-auto",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-5 gap-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Label"], {
                                            className: "text-xs",
                                            children: "Duration (s)"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 125,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                            type: "number",
                                            value: config.tEnd,
                                            onChange: (e)=>setConfig({
                                                    tEnd: parseFloat(e.target.value) || 60
                                                }),
                                            className: "h-8"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 126,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 124,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Label"], {
                                            className: "text-xs",
                                            children: "Target Speed (km/h)"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 136,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                            type: "number",
                                            value: (config.targetVelocity * 3.6).toFixed(1),
                                            onChange: (e)=>setConfig({
                                                    targetVelocity: (parseFloat(e.target.value) || 0) / 3.6
                                                }),
                                            className: "h-8"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 137,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 135,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Label"], {
                                            className: "text-xs",
                                            children: "Grade (%)"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 149,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                            type: "number",
                                            value: (config.grade * 100).toFixed(1),
                                            onChange: (e)=>setConfig({
                                                    grade: (parseFloat(e.target.value) || 0) / 100
                                                }),
                                            step: 0.5,
                                            className: "h-8"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 150,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 148,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Label"], {
                                            className: "text-xs",
                                            children: "Payload (%)"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 161,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                            type: "number",
                                            value: (config.payloadFraction * 100).toFixed(0),
                                            onChange: (e)=>setConfig({
                                                    payloadFraction: (parseFloat(e.target.value) || 100) / 100
                                                }),
                                            className: "h-8"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 162,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 160,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Label"], {
                                            className: "text-xs",
                                            children: "Output Step (s)"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 174,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                            type: "number",
                                            value: config.dtOutput,
                                            onChange: (e)=>setConfig({
                                                    dtOutput: parseFloat(e.target.value) || 0.1
                                                }),
                                            step: 0.05,
                                            className: "h-8"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 175,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 173,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                            lineNumber: 123,
                            columnNumber: 11
                        }, this),
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "font-semibold",
                                    children: "Simulation Error:"
                                }, void 0, false, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 189,
                                    columnNumber: 15
                                }, this),
                                " ",
                                error
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                            lineNumber: 188,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                    lineNumber: 122,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TabsContent"], {
                    value: "results",
                    className: "flex-1 overflow-hidden",
                    children: result ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$charts$2f$SimulationChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SimulationChart"], {
                        time: result.time,
                        velocity: result.velocity,
                        grade: result.grade,
                        fuelRate: result.fuelRate,
                        enginePower: result.enginePower,
                        motorPower: result.motorPower
                    }, void 0, false, {
                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                        lineNumber: 196,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-full flex items-center justify-center text-muted",
                        children: status === "running" ? "Simulation in progress..." : "Run a simulation to see results"
                    }, void 0, false, {
                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                        lineNumber: 205,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                    lineNumber: 194,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TabsContent"], {
                    value: "rimpull",
                    className: "flex-1 overflow-hidden",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$charts$2f$RimpullChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RimpullChart"], {
                        curves: rimpullCurves
                    }, void 0, false, {
                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                        lineNumber: 214,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                    lineNumber: 213,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
            lineNumber: 70,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
        lineNumber: 69,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/gearbox-analyzer/components/charts/ComparisonChart.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ComparisonChart",
    ()=>ComparisonChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/shared/lib/app-dynamic.js [app-ssr] (ecmascript)");
;
"use client";
;
;
const Plot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(async ()=>{}, {
    loadableGenerated: {
        modules: [
            "[project]/node_modules/react-plotly.js/react-plotly.js [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false
});
const METRIC_CONFIG = {
    velocity: {
        label: "Velocity",
        unit: "km/h",
        transform: (v)=>v * 3.6
    },
    fuelRate: {
        label: "Fuel Rate",
        unit: "kg/h",
        transform: (v)=>v * 3600
    },
    enginePower: {
        label: "Engine Power",
        unit: "kW",
        transform: (v)=>v / 1000
    },
    motorPower: {
        label: "Motor Power",
        unit: "kW",
        transform: (v)=>v / 1000
    }
};
function ComparisonChart({ results, metric }) {
    if (results.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full h-full flex items-center justify-center text-muted",
            children: "Run comparison to see results"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/charts/ComparisonChart.tsx",
            lineNumber: 39,
            columnNumber: 7
        }, this);
    }
    const config = METRIC_CONFIG[metric];
    const traces = results.filter((r)=>{
        if (metric === "velocity") return true;
        if (metric === "fuelRate") return r.result.fuelRate;
        if (metric === "enginePower") return r.result.enginePower;
        if (metric === "motorPower") return r.result.motorPower;
        return false;
    }).map((r)=>{
        let yData = [];
        switch(metric){
            case "velocity":
                yData = r.result.velocity;
                break;
            case "fuelRate":
                yData = r.result.fuelRate || [];
                break;
            case "enginePower":
                yData = r.result.enginePower || [];
                break;
            case "motorPower":
                yData = r.result.motorPower || [];
                break;
        }
        return {
            x: r.result.time,
            y: yData.map(config.transform),
            type: "scatter",
            mode: "lines",
            name: r.label,
            line: {
                color: r.color,
                width: 2
            }
        };
    });
    const layout = {
        autosize: true,
        margin: {
            t: 30,
            r: 30,
            b: 50,
            l: 60
        },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: {
            color: "#888"
        },
        xaxis: {
            title: "Time (s)",
            gridcolor: "#333",
            zerolinecolor: "#444"
        },
        yaxis: {
            title: `${config.label} (${config.unit})`,
            gridcolor: "#333",
            zerolinecolor: "#444"
        },
        legend: {
            x: 0,
            y: 1,
            bgcolor: "rgba(0,0,0,0.5)"
        },
        showlegend: true
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full h-full min-h-[300px]",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Plot, {
            data: traces,
            layout: layout,
            config: {
                displayModeBar: false,
                responsive: true
            },
            useResizeHandler: true,
            style: {
                width: "100%",
                height: "100%"
            }
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/charts/ComparisonChart.tsx",
            lineNumber: 108,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/charts/ComparisonChart.tsx",
        lineNumber: 107,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/gearbox-analyzer/components/charts/ComparisonRimpullChart.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ComparisonRimpullChart",
    ()=>ComparisonRimpullChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/shared/lib/app-dynamic.js [app-ssr] (ecmascript)");
;
"use client";
;
;
const Plot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(async ()=>{}, {
    loadableGenerated: {
        modules: [
            "[project]/node_modules/react-plotly.js/react-plotly.js [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false
});
/**
 * Interpolate force at a given velocity from a curve's points.
 */ function interpolateForce(points, velocity) {
    if (points.length === 0) return 0;
    // Find surrounding points
    let left = 0;
    let right = points.length - 1;
    // Check bounds
    if (velocity <= points[0].velocity) return points[0].force;
    if (velocity >= points[right].velocity) return points[right].force;
    // Binary search for surrounding points
    for(let i = 0; i < points.length - 1; i++){
        if (points[i].velocity <= velocity && points[i + 1].velocity >= velocity) {
            left = i;
            right = i + 1;
            break;
        }
    }
    // Linear interpolation
    const v0 = points[left].velocity;
    const v1 = points[right].velocity;
    const f0 = points[left].force;
    const f1 = points[right].force;
    if (v1 === v0) return f0;
    const t = (velocity - v0) / (v1 - v0);
    return f0 + t * (f1 - f0);
}
/**
 * Compute the envelope (max force) across all gear curves at each velocity.
 */ function computeEnvelope(gearCurves, velocities) {
    return velocities.map((v)=>{
        let maxForce = 0;
        for (const curve of gearCurves){
            const force = interpolateForce(curve.points, v);
            maxForce = Math.max(maxForce, force);
        }
        return maxForce;
    });
}
function ComparisonRimpullChart({ results }) {
    if (results.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full h-full flex items-center justify-center text-muted",
            children: "Run comparison to see rimpull curves"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/charts/ComparisonRimpullChart.tsx",
            lineNumber: 67,
            columnNumber: 7
        }, this);
    }
    const traces = [];
    // Common velocity grid (0 to 60 km/h in m/s)
    const numPoints = 200;
    const maxSpeedMs = 60 / 3.6;
    const commonVelocities = [];
    for(let i = 0; i <= numPoints; i++){
        commonVelocities.push(maxSpeedMs * i / numPoints);
    }
    // Add rimpull curves from each preset (only gear curves, not resistance)
    for (const r of results){
        const gearCurves = r.rimpullCurves.filter((c)=>!c.name.includes("Resistance") && !c.name.includes("Rolling"));
        // Compute envelope by interpolating all curves to common velocity grid
        if (gearCurves.length > 0) {
            const envelopeForces = computeEnvelope(gearCurves, commonVelocities);
            traces.push({
                x: commonVelocities.map((v)=>v * 3.6),
                y: envelopeForces.map((f)=>f / 1000),
                type: "scatter",
                mode: "lines",
                name: r.label,
                line: {
                    color: r.color,
                    width: 3
                },
                fill: "tozeroy",
                fillcolor: `${r.color}20`
            });
        }
    }
    // Add resistance curves (from first result, since they should be the same)
    if (results.length > 0) {
        const resistanceCurves = results[0].rimpullCurves.filter((c)=>c.name.includes("Resistance") || c.name.includes("Rolling"));
        for (const curve of resistanceCurves){
            traces.push({
                x: curve.points.map((p)=>p.velocity * 3.6),
                y: curve.points.map((p)=>p.force / 1000),
                type: "scatter",
                mode: "lines",
                name: curve.name,
                line: {
                    color: curve.color,
                    width: 1.5,
                    dash: "dash"
                }
            });
        }
    }
    const layout = {
        autosize: true,
        margin: {
            t: 30,
            r: 30,
            b: 50,
            l: 60
        },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: {
            color: "#888"
        },
        xaxis: {
            title: "Speed (km/h)",
            gridcolor: "#333",
            zerolinecolor: "#444",
            range: [
                0,
                60
            ]
        },
        yaxis: {
            title: "Tractive Force (kN)",
            gridcolor: "#333",
            zerolinecolor: "#444",
            range: [
                0,
                null
            ]
        },
        legend: {
            x: 1,
            xanchor: "right",
            y: 1,
            bgcolor: "rgba(0,0,0,0.5)"
        },
        showlegend: true
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full h-full min-h-[300px]",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Plot, {
            data: traces,
            layout: layout,
            config: {
                displayModeBar: false,
                responsive: true
            },
            useResizeHandler: true,
            style: {
                width: "100%",
                height: "100%"
            }
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/charts/ComparisonRimpullChart.tsx",
            lineNumber: 157,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/charts/ComparisonRimpullChart.tsx",
        lineNumber: 156,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SimulationView",
    ()=>SimulationView
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/play.js [app-ssr] (ecmascript) <export default as Play>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rotate-ccw.js [app-ssr] (ecmascript) <export default as RotateCcw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-ssr] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-ssr] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$git$2d$compare$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__GitCompare$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/git-compare.js [app-ssr] (ecmascript) <export default as GitCompare>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-ssr] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/input.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/label.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/tabs.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/stores/drivetrain-store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/stores/simulation-store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$hooks$2f$useSimulation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/hooks/useSimulation.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$charts$2f$SimulationChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/charts/SimulationChart.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$charts$2f$RimpullChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/charts/RimpullChart.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$charts$2f$ComparisonChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/charts/ComparisonChart.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$charts$2f$ComparisonRimpullChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/charts/ComparisonRimpullChart.tsx [app-ssr] (ecmascript)");
"use client";
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
;
;
;
const ALL_PRESETS = [
    "diesel-793d",
    "ecvt-split",
    "ecvt-locked"
];
function SimulationView({ onClose }) {
    const nodes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.nodes);
    const edges = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.edges);
    const validateTopology = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.validateTopology);
    const loadPreset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.loadPreset);
    const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.config);
    const setConfig = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.setConfig);
    const status = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.status);
    const progress = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.progress);
    const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.result);
    const error = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.error);
    const rimpullCurves = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.rimpullCurves);
    const reset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.reset);
    // Comparison state
    const comparisonResults = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.comparisonResults);
    const addComparisonResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.addComparisonResult);
    const clearComparisonResults = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.clearComparisonResults);
    const runningPreset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.runningPreset);
    const setRunningPreset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"])((s)=>s.setRunningPreset);
    const [isComparing, setIsComparing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [completedPresets, setCompletedPresets] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const { runSimulation, calculateRimpull } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$hooks$2f$useSimulation$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulation"])();
    // Calculate rimpull when nodes/edges change
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (nodes.length > 0) {
            calculateRimpull(nodes, edges);
        }
    }, [
        nodes,
        edges,
        calculateRimpull
    ]);
    const handleRunSimulation = async ()=>{
        if (nodes.length === 0) {
            alert("No components in the topology. Load a preset or add components first.");
            return;
        }
        const validation = validateTopology();
        if (!validation.isValid) {
            alert("Invalid topology:\n" + validation.errors.join("\n"));
            return;
        }
        try {
            await runSimulation(nodes, edges);
        } catch (err) {
            console.error("Simulation error:", err);
            alert("Simulation failed: " + (err instanceof Error ? err.message : "Unknown error"));
        }
    };
    const runComparisonForPreset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (preset)=>{
        try {
            // Load the preset
            loadPreset(preset);
            // Wait a tick for state to update
            await new Promise((resolve)=>setTimeout(resolve, 50));
            // Get the new nodes/edges from store
            const state = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"].getState();
            const presetNodes = state.nodes;
            const presetEdges = state.edges;
            if (presetNodes.length === 0) {
                console.error(`No nodes for preset ${preset}`);
                return null;
            }
            // Calculate rimpull for this preset
            calculateRimpull(presetNodes, presetEdges);
            const presetRimpull = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"].getState().rimpullCurves;
            // Run simulation
            await runSimulation(presetNodes, presetEdges);
            // Get result
            const simResult = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSimulationStore"].getState().result;
            if (!simResult) {
                console.error(`No result for preset ${preset}`);
                return null;
            }
            return {
                preset,
                label: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PRESET_LABELS"][preset],
                color: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PRESET_COLORS"][preset],
                result: simResult,
                rimpullCurves: presetRimpull
            };
        } catch (err) {
            console.error(`Error running ${preset}:`, err);
            return null;
        }
    }, [
        loadPreset,
        runSimulation,
        calculateRimpull
    ]);
    const handleRunComparison = async ()=>{
        setIsComparing(true);
        setCompletedPresets([]);
        clearComparisonResults();
        for (const preset of ALL_PRESETS){
            setRunningPreset(preset);
            const result = await runComparisonForPreset(preset);
            if (result) {
                addComparisonResult(result);
                setCompletedPresets((prev)=>[
                        ...prev,
                        preset
                    ]);
            }
        }
        setRunningPreset(null);
        setIsComparing(false);
    };
    const handleClearComparison = ()=>{
        clearComparisonResults();
        setCompletedPresets([]);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 bg-black/90 flex flex-col",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-14 flex items-center justify-between px-6 border-b border-subtle bg-dark",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-lg font-semibold text-primary",
                        children: "Simulation & Analysis"
                    }, void 0, false, {
                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                        lineNumber: 158,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3",
                                children: [
                                    status === "running" && !isComparing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2 text-sm text-muted",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                                className: "h-4 w-4 animate-spin text-accent"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 165,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "h-2 w-40 bg-subtle rounded-full overflow-hidden",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "h-full bg-accent transition-all",
                                                    style: {
                                                        width: `${progress * 100}%`
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                    lineNumber: 167,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 166,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: [
                                                    Math.round(progress * 100),
                                                    "%"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 172,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 164,
                                        columnNumber: 15
                                    }, this),
                                    status === "error" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-1 text-sm text-red-500",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                                className: "h-4 w-4"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 178,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Error"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 179,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 177,
                                        columnNumber: 15
                                    }, this),
                                    status !== "running" && !isComparing ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                        type: "button",
                                        variant: "accent",
                                        size: "sm",
                                        onClick: handleRunSimulation,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__["Play"], {
                                                className: "h-4 w-4 mr-1"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 185,
                                                columnNumber: 17
                                            }, this),
                                            "Run Current"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 184,
                                        columnNumber: 15
                                    }, this) : !isComparing ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                        type: "button",
                                        variant: "destructive",
                                        size: "sm",
                                        onClick: reset,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                                className: "h-4 w-4 mr-1 animate-spin"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 190,
                                                columnNumber: 17
                                            }, this),
                                            "Running..."
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 189,
                                        columnNumber: 15
                                    }, this) : null,
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                        type: "button",
                                        variant: isComparing ? "destructive" : "default",
                                        size: "sm",
                                        onClick: handleRunComparison,
                                        disabled: isComparing,
                                        children: isComparing ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                                    className: "h-4 w-4 mr-1 animate-spin"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                    lineNumber: 204,
                                                    columnNumber: 19
                                                }, this),
                                                "Comparing..."
                                            ]
                                        }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$git$2d$compare$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__GitCompare$3e$__["GitCompare"], {
                                                    className: "h-4 w-4 mr-1"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                    lineNumber: 209,
                                                    columnNumber: 19
                                                }, this),
                                                "Compare All"
                                            ]
                                        }, void 0, true)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 195,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                        type: "button",
                                        variant: "outline",
                                        size: "sm",
                                        onClick: ()=>{
                                            reset();
                                            handleClearComparison();
                                        },
                                        disabled: status === "running" || isComparing,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                                            className: "h-4 w-4"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                            lineNumber: 225,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 215,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                lineNumber: 162,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-px h-8 bg-subtle"
                            }, void 0, false, {
                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                lineNumber: 229,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                type: "button",
                                variant: "ghost",
                                size: "icon-sm",
                                onClick: onClose,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    className: "h-5 w-5"
                                }, void 0, false, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                    lineNumber: 232,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                lineNumber: 231,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                        lineNumber: 160,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                lineNumber: 157,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 flex overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-72 border-r border-subtle bg-dark p-4 overflow-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-sm font-medium text-primary mb-4",
                                children: "Configuration"
                            }, void 0, false, {
                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                lineNumber: 241,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Label"], {
                                                className: "text-xs",
                                                children: "Duration (s)"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 245,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                                type: "number",
                                                value: config.tEnd,
                                                onChange: (e)=>setConfig({
                                                        tEnd: parseFloat(e.target.value) || 60
                                                    })
                                            }, void 0, false, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 246,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 244,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Label"], {
                                                className: "text-xs",
                                                children: "Target Speed (km/h)"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 254,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                                type: "number",
                                                value: (config.targetVelocity * 3.6).toFixed(1),
                                                onChange: (e)=>setConfig({
                                                        targetVelocity: (parseFloat(e.target.value) || 0) / 3.6
                                                    })
                                            }, void 0, false, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 255,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 253,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Label"], {
                                                className: "text-xs",
                                                children: "Grade (%)"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 263,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                                type: "number",
                                                value: (config.grade * 100).toFixed(1),
                                                onChange: (e)=>setConfig({
                                                        grade: (parseFloat(e.target.value) || 0) / 100
                                                    }),
                                                step: 0.5
                                            }, void 0, false, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 264,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 262,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Label"], {
                                                className: "text-xs",
                                                children: "Payload (%)"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 273,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                                type: "number",
                                                value: (config.payloadFraction * 100).toFixed(0),
                                                onChange: (e)=>setConfig({
                                                        payloadFraction: (parseFloat(e.target.value) || 100) / 100
                                                    })
                                            }, void 0, false, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 274,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 272,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Label"], {
                                                className: "text-xs",
                                                children: "Output Step (s)"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 282,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                                type: "number",
                                                value: config.dtOutput,
                                                onChange: (e)=>setConfig({
                                                        dtOutput: parseFloat(e.target.value) || 0.1
                                                    }),
                                                step: 0.05
                                            }, void 0, false, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 283,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 281,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                lineNumber: 243,
                                columnNumber: 11
                            }, this),
                            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-semibold",
                                        children: "Error:"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 294,
                                        columnNumber: 15
                                    }, this),
                                    " ",
                                    error
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                lineNumber: 293,
                                columnNumber: 13
                            }, this),
                            (isComparing || comparisonResults.length > 0) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-6 pt-4 border-t border-subtle",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-sm font-medium text-primary mb-3",
                                        children: "Comparison Status"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 301,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-2",
                                        children: ALL_PRESETS.map((preset)=>{
                                            const isRunning = runningPreset === preset;
                                            const isComplete = completedPresets.includes(preset);
                                            const hasResult = comparisonResults.some((r)=>r.preset === preset);
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2 text-xs",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "w-3 h-3 rounded-full",
                                                        style: {
                                                            backgroundColor: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PRESET_COLORS"][preset]
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                        lineNumber: 313,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "flex-1 text-muted",
                                                        children: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PRESET_LABELS"][preset]
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                        lineNumber: 317,
                                                        columnNumber: 23
                                                    }, this),
                                                    isRunning && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                                        className: "h-3 w-3 animate-spin text-accent"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                        lineNumber: 318,
                                                        columnNumber: 37
                                                    }, this),
                                                    hasResult && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                                        className: "h-3 w-3 text-green-500"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                        lineNumber: 319,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, preset, true, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 309,
                                                columnNumber: 21
                                            }, this);
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 302,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                lineNumber: 300,
                                columnNumber: 13
                            }, this),
                            result && !isComparing && comparisonResults.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-6 pt-4 border-t border-subtle",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-sm font-medium text-primary mb-3",
                                        children: "Results Summary"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 330,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-2 text-xs",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex justify-between",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-muted",
                                                        children: "Final Speed:"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                        lineNumber: 333,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-primary",
                                                        children: [
                                                            (result.velocity[result.velocity.length - 1] * 3.6).toFixed(1),
                                                            " km/h"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                        lineNumber: 334,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 332,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex justify-between",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-muted",
                                                        children: "Max Speed:"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                        lineNumber: 339,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-primary",
                                                        children: [
                                                            (Math.max(...result.velocity) * 3.6).toFixed(1),
                                                            " km/h"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                        lineNumber: 340,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 338,
                                                columnNumber: 17
                                            }, this),
                                            result.fuelRate && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex justify-between",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-muted",
                                                        children: "Avg Fuel Rate:"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                        lineNumber: 346,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-primary",
                                                        children: [
                                                            (result.fuelRate.reduce((a, b)=>a + b, 0) / result.fuelRate.length * 3600).toFixed(1),
                                                            " kg/h"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                        lineNumber: 347,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 345,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex justify-between",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-muted",
                                                        children: "Sim Duration:"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                        lineNumber: 353,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-primary",
                                                        children: [
                                                            result.time.length,
                                                            " points"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                        lineNumber: 354,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 352,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 331,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                lineNumber: 329,
                                columnNumber: 13
                            }, this),
                            comparisonResults.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-6 pt-4 border-t border-subtle",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-sm font-medium text-primary mb-3",
                                        children: "Comparison Summary"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 363,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-3",
                                        children: comparisonResults.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-xs",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-2 mb-1",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "w-2 h-2 rounded-full",
                                                                style: {
                                                                    backgroundColor: r.color
                                                                }
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                                lineNumber: 368,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "font-medium text-primary",
                                                                children: r.label
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                                lineNumber: 372,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                        lineNumber: 367,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "pl-4 space-y-1 text-muted",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex justify-between",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        children: "Max Speed:"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                                        lineNumber: 376,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        children: [
                                                                            (Math.max(...r.result.velocity) * 3.6).toFixed(1),
                                                                            " km/h"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                                        lineNumber: 377,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                                lineNumber: 375,
                                                                columnNumber: 23
                                                            }, this),
                                                            r.result.fuelRate && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex justify-between",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        children: "Avg Fuel:"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                                        lineNumber: 381,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        children: [
                                                                            (r.result.fuelRate.reduce((a, b)=>a + b, 0) / r.result.fuelRate.length * 3600).toFixed(1),
                                                                            " kg/h"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                                        lineNumber: 382,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                                lineNumber: 380,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                        lineNumber: 374,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, r.preset, true, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 366,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 364,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                lineNumber: 362,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                        lineNumber: 240,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 p-6 overflow-auto",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Tabs"], {
                            defaultValue: "comparison",
                            className: "h-full flex flex-col",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TabsList"], {
                                    className: "mb-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TabsTrigger"], {
                                            value: "comparison",
                                            children: "Comparison"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                            lineNumber: 399,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TabsTrigger"], {
                                            value: "results",
                                            children: "Current Topology"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                            lineNumber: 400,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TabsTrigger"], {
                                            value: "rimpull",
                                            children: "Rimpull (Current)"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                            lineNumber: 401,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                    lineNumber: 398,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TabsContent"], {
                                    value: "comparison",
                                    className: "flex-1",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-full grid grid-rows-2 gap-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bg-surface rounded-lg border border-subtle p-4",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                        className: "text-sm font-medium text-primary mb-2",
                                                        children: "Velocity Comparison"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                        lineNumber: 407,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "h-[calc(100%-2rem)]",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$charts$2f$ComparisonChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ComparisonChart"], {
                                                            results: comparisonResults,
                                                            metric: "velocity"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                            lineNumber: 409,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                        lineNumber: 408,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 406,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bg-surface rounded-lg border border-subtle p-4",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                        className: "text-sm font-medium text-primary mb-2",
                                                        children: "Rimpull Comparison"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                        lineNumber: 413,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "h-[calc(100%-2rem)]",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$charts$2f$ComparisonRimpullChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ComparisonRimpullChart"], {
                                                            results: comparisonResults
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                            lineNumber: 415,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                        lineNumber: 414,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 412,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 405,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                    lineNumber: 404,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TabsContent"], {
                                    value: "results",
                                    className: "flex-1",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-full bg-surface rounded-lg border border-subtle p-4",
                                        children: result ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$charts$2f$SimulationChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SimulationChart"], {
                                            time: result.time,
                                            velocity: result.velocity,
                                            grade: result.grade,
                                            fuelRate: result.fuelRate,
                                            enginePower: result.enginePower,
                                            motorPower: result.motorPower
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                            lineNumber: 424,
                                            columnNumber: 19
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "h-full flex items-center justify-center text-muted",
                                            children: status === "running" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-col items-center gap-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                                        className: "h-8 w-8 animate-spin text-accent"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                        lineNumber: 436,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Simulation in progress..."
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                        lineNumber: 437,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 435,
                                                columnNumber: 23
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Run a simulation to see results"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                                lineNumber: 440,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                            lineNumber: 433,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 422,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                    lineNumber: 421,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TabsContent"], {
                                    value: "rimpull",
                                    className: "flex-1",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-full bg-surface rounded-lg border border-subtle p-4",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$charts$2f$RimpullChart$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RimpullChart"], {
                                            curves: rimpullCurves
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                            lineNumber: 449,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                        lineNumber: 448,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                                    lineNumber: 447,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                            lineNumber: 397,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                        lineNumber: 396,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
                lineNumber: 238,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx",
        lineNumber: 155,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DrivetrainEditor",
    ()=>DrivetrainEditor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@xyflow/react/dist/esm/index.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chart-column.js [app-ssr] (ecmascript) <export default as BarChart3>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/stores/drivetrain-store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/index.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$panels$2f$ComponentPalette$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$panels$2f$PropertiesPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$panels$2f$SimulationPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$panels$2f$SimulationView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/panels/SimulationView.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/button.tsx [app-ssr] (ecmascript)");
"use client";
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
;
// Custom edge styles
const edgeTypes = {};
const defaultEdgeOptions = {
    style: {
        strokeWidth: 2
    },
    animated: false
};
function DrivetrainEditor() {
    const [showSimulationView, setShowSimulationView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const nodes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.nodes);
    const edges = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.edges);
    const onNodesChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.onNodesChange);
    const onEdgesChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.onEdgesChange);
    const addNode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.addNode);
    const addEdge_ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.addEdge);
    const setSelectedNode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDrivetrainStore"])((s)=>s.setSelectedNode);
    const onConnect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((connection)=>{
        // Determine edge type based on handle names
        const edgeType = connection.sourceHandle?.includes("electrical") || connection.targetHandle?.includes("electrical") ? "electrical" : "mechanical";
        const newEdge = {
            id: `e-${connection.source}-${connection.target}-${Date.now()}`,
            source: connection.source,
            target: connection.target,
            sourceHandle: connection.sourceHandle,
            targetHandle: connection.targetHandle,
            style: {
                stroke: edgeType === "mechanical" ? "#10b981" : "#f59e0b",
                strokeWidth: 2
            },
            animated: edgeType === "electrical"
        };
        addEdge_(newEdge);
    }, [
        addEdge_
    ]);
    const onDragOver = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((event)=>{
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);
    const onDrop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((event)=>{
        event.preventDefault();
        const type = event.dataTransfer.getData("application/reactflow");
        if (!type) return;
        // Get position from drop coordinates
        const reactFlowBounds = event.currentTarget.getBoundingClientRect();
        const position = {
            x: event.clientX - reactFlowBounds.left - 70,
            y: event.clientY - reactFlowBounds.top - 50
        };
        addNode(type, position);
    }, [
        addNode
    ]);
    const onPaneClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        setSelectedNode(null);
    }, [
        setSelectedNode
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-screen flex flex-col bg-black",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "h-14 flex items-center justify-between px-4 border-b border-subtle bg-dark",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-lg font-semibold text-primary",
                                children: "Gearbox Analyzer"
                            }, void 0, false, {
                                fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                                lineNumber: 104,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "ml-4 text-sm text-muted",
                                children: "Visual Drivetrain Simulation Tool"
                            }, void 0, false, {
                                fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                                lineNumber: 105,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                        lineNumber: 103,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                        type: "button",
                        variant: "accent",
                        onClick: ()=>setShowSimulationView(true),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__["BarChart3"], {
                                className: "h-4 w-4 mr-2"
                            }, void 0, false, {
                                fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                                lineNumber: 115,
                                columnNumber: 11
                            }, this),
                            "Open Simulation"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                        lineNumber: 110,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                lineNumber: 102,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 flex overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$panels$2f$ComponentPalette$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ComponentPalette"], {}, void 0, false, {
                        fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                        lineNumber: 123,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 flex flex-col",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ReactFlow"], {
                                    nodes: nodes,
                                    edges: edges,
                                    onNodesChange: onNodesChange,
                                    onEdgesChange: onEdgesChange,
                                    onConnect: onConnect,
                                    onDragOver: onDragOver,
                                    onDrop: onDrop,
                                    onPaneClick: onPaneClick,
                                    nodeTypes: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["nodeTypes"],
                                    edgeTypes: edgeTypes,
                                    defaultEdgeOptions: defaultEdgeOptions,
                                    fitView: true,
                                    proOptions: {
                                        hideAttribution: true
                                    },
                                    className: "bg-black",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Background"], {
                                            variant: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["BackgroundVariant"].Dots,
                                            gap: 20,
                                            size: 1,
                                            color: "#2a2a2a"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                                            lineNumber: 144,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Controls"], {
                                            className: "bg-surface border-subtle [&>button]:bg-surface [&>button]:border-subtle [&>button]:text-primary [&>button:hover]:bg-subtle"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                                            lineNumber: 150,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["MiniMap"], {
                                            className: "!bg-surface",
                                            nodeColor: (node)=>{
                                                switch(node.data?.componentType){
                                                    case "engine":
                                                        return "#dc2626";
                                                    case "motor":
                                                        return "#2563eb";
                                                    case "gearbox":
                                                        return "#9333ea";
                                                    case "planetary":
                                                        return "#0d9488";
                                                    case "battery":
                                                        return "#d97706";
                                                    case "vehicle":
                                                        return "#16a34a";
                                                    default:
                                                        return "#6b7280";
                                                }
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                                            lineNumber: 151,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                                    lineNumber: 128,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                                lineNumber: 127,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$panels$2f$SimulationPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SimulationPanel"], {}, void 0, false, {
                                fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                                lineNumber: 176,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                        lineNumber: 126,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$panels$2f$PropertiesPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PropertiesPanel"], {}, void 0, false, {
                        fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                        lineNumber: 180,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                lineNumber: 121,
                columnNumber: 7
            }, this),
            showSimulationView && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$panels$2f$SimulationView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SimulationView"], {
                onClose: ()=>setShowSimulationView(false)
            }, void 0, false, {
                fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                lineNumber: 185,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
        lineNumber: 100,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/gearbox-analyzer/app/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$DrivetrainEditor$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx [app-ssr] (ecmascript)");
"use client";
;
;
function Home() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$DrivetrainEditor$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DrivetrainEditor"], {}, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/app/page.tsx",
        lineNumber: 6,
        columnNumber: 10
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__daac0ee7._.js.map