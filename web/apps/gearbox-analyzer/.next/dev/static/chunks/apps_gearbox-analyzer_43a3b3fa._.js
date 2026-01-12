(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/apps/gearbox-analyzer/stores/drivetrain-store.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useDrivetrainStore",
    ()=>useDrivetrainStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@xyflow/react/dist/esm/index.js [app-client] (ecmascript) <locals>");
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
const useDrivetrainStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])((set, get)=>({
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
                    nodes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["applyNodeChanges"])(changes, state.nodes)
                }));
        },
        onEdgesChange: (changes)=>{
            set((state)=>({
                    edges: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["applyEdgeChanges"])(changes, state.edges)
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
                                sourceHandle: "shaft",
                                targetHandle: "sun",
                                type: "mechanical"
                            },
                            {
                                id: "e3",
                                source: "planetary-1",
                                target: "motor-2",
                                sourceHandle: "ring",
                                targetHandle: "shaft",
                                type: "mechanical"
                            },
                            {
                                id: "e4",
                                source: "motor-2",
                                target: "gearbox-1",
                                sourceHandle: "shaft",
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
                                targetHandle: "shaft",
                                type: "mechanical"
                            },
                            {
                                id: "e2",
                                source: "motor-2",
                                target: "gearbox-1",
                                sourceHandle: "shaft",
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BaseNode",
    ()=>BaseNode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@xyflow/react/dist/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@xyflow/system/dist/esm/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/stores/drivetrain-store.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function BaseNode({ id, data, selected, icon, color, handles, children }) {
    _s();
    const setSelectedNode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"])({
        "BaseNode.useDrivetrainStore[setSelectedNode]": (s)=>s.setSelectedNode
    }["BaseNode.useDrivetrainStore[setSelectedNode]"]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("relative min-w-[140px] rounded-lg border-2 bg-surface p-3 shadow-lg transition-all", selected ? "border-accent shadow-accent/20" : "border-subtle hover:border-secondary"),
        onClick: ()=>setSelectedNode(id),
        children: [
            handles.map((handle)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Handle"], {
                    id: handle.id,
                    type: handle.position === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Position"].Left || handle.position === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Position"].Top ? "target" : "source",
                    position: handle.position,
                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("!h-3 !w-3 !rounded-full !border-2 !border-dark transition-all hover:!scale-125", handle.type === "mechanical" ? "!bg-emerald-500" : "!bg-amber-500"),
                    title: handle.label
                }, handle.id, false, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx",
                    lineNumber: 42,
                    columnNumber: 9
                }, this)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2 mb-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex h-8 w-8 items-center justify-center rounded-md", color),
                        children: icon
                    }, void 0, false, {
                        fileName: "[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx",
                        lineNumber: 57,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 min-w-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-sm font-medium text-primary truncate",
                                children: data.label
                            }, void 0, false, {
                                fileName: "[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx",
                                lineNumber: 63,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
            children && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
_s(BaseNode, "dSGH9NyIRLfFuowlsTsbNtOcMzk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"]
    ];
});
_c = BaseNode;
var _c;
__turbopack_context__.k.register(_c, "BaseNode");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/components/nodes/EngineNode.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EngineNode",
    ()=>EngineNode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@xyflow/system/dist/esm/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$flame$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Flame$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/flame.js [app-client] (ecmascript) <export default as Flame>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx [app-client] (ecmascript)");
"use client";
;
;
;
;
const handles = [
    {
        id: "shaft",
        type: "mechanical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Position"].Right,
        label: "Crankshaft"
    }
];
function EngineNode(props) {
    const { data } = props;
    const params = data.params;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseNode"], {
        ...props,
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$flame$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Flame$3e$__["Flame"], {
            className: "h-4 w-4 text-white"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/nodes/EngineNode.tsx",
            lineNumber: 24,
            columnNumber: 13
        }, void 0),
        color: "bg-red-600",
        handles: handles,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Power:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/EngineNode.tsx",
                            lineNumber: 30,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Torque:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/EngineNode.tsx",
                            lineNumber: 34,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "RPM:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/EngineNode.tsx",
                            lineNumber: 38,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
_c = EngineNode;
var _c;
__turbopack_context__.k.register(_c, "EngineNode");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MotorNode",
    ()=>MotorNode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@xyflow/system/dist/esm/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/zap.js [app-client] (ecmascript) <export default as Zap>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx [app-client] (ecmascript)");
"use client";
;
;
;
;
const handles = [
    {
        id: "shaft",
        type: "mechanical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Position"].Right,
        label: "Motor Shaft"
    },
    {
        id: "electrical",
        type: "electrical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Position"].Bottom,
        label: "Electrical"
    }
];
function MotorNode(props) {
    const { data } = props;
    const params = data.params;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseNode"], {
        ...props,
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__["Zap"], {
            className: "h-4 w-4 text-white"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
            lineNumber: 26,
            columnNumber: 13
        }, void 0),
        color: "bg-blue-600",
        handles: handles,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Power:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                            lineNumber: 32,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: [
                                ((params.pMax ?? 200000) / 1000).toFixed(0),
                                " kW"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                            lineNumber: 33,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                    lineNumber: 31,
                    columnNumber: 9
                }, this),
                params.pBoost && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Boost:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                            lineNumber: 37,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-accent",
                            children: [
                                (params.pBoost / 1000).toFixed(0),
                                " kW"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                            lineNumber: 38,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                    lineNumber: 36,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Torque:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                            lineNumber: 42,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: [
                                (params.tMax ?? 3000).toLocaleString(),
                                " N·m"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                            lineNumber: 43,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                    lineNumber: 41,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Efficiency:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                            lineNumber: 46,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-primary",
                            children: [
                                ((params.eta ?? 0.92) * 100).toFixed(0),
                                "%"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                            lineNumber: 47,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
                    lineNumber: 45,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
            lineNumber: 30,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
_c = MotorNode;
var _c;
__turbopack_context__.k.register(_c, "MotorNode");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/components/nodes/GearboxNode.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GearboxNode",
    ()=>GearboxNode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@xyflow/system/dist/esm/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx [app-client] (ecmascript)");
"use client";
;
;
;
;
const handles = [
    {
        id: "input",
        type: "mechanical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Position"].Left,
        label: "Input Shaft"
    },
    {
        id: "output",
        type: "mechanical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Position"].Right,
        label: "Output Shaft"
    }
];
function GearboxNode(props) {
    const { data } = props;
    const params = data.params;
    const ratios = params.ratios ?? [
        1.0
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseNode"], {
        ...props,
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
            className: "h-4 w-4 text-white"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/nodes/GearboxNode.tsx",
            lineNumber: 25,
            columnNumber: 13
        }, void 0),
        color: "bg-purple-600",
        handles: handles,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Gears:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/GearboxNode.tsx",
                            lineNumber: 31,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Ratios:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/GearboxNode.tsx",
                            lineNumber: 35,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
_c = GearboxNode;
var _c;
__turbopack_context__.k.register(_c, "GearboxNode");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/components/nodes/PlanetaryNode.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PlanetaryNode",
    ()=>PlanetaryNode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@xyflow/system/dist/esm/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Circle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle.js [app-client] (ecmascript) <export default as Circle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx [app-client] (ecmascript)");
"use client";
;
;
;
;
const handles = [
    {
        id: "sun",
        type: "mechanical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Position"].Top,
        label: "Sun Gear"
    },
    {
        id: "carrier",
        type: "mechanical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Position"].Left,
        label: "Carrier"
    },
    {
        id: "ring",
        type: "mechanical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Position"].Right,
        label: "Ring Gear"
    }
];
function PlanetaryNode(props) {
    const { data } = props;
    const params = data.params;
    const zSun = params.zSun ?? 30;
    const zRing = params.zRing ?? 90;
    const rho = zRing / zSun;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseNode"], {
        ...props,
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Circle$3e$__["Circle"], {
            className: "h-4 w-4 text-white"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/nodes/PlanetaryNode.tsx",
            lineNumber: 28,
            columnNumber: 13
        }, void 0),
        color: "bg-teal-600",
        handles: handles,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Sun:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/PlanetaryNode.tsx",
                            lineNumber: 34,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Ring:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/PlanetaryNode.tsx",
                            lineNumber: 38,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "ρ:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/PlanetaryNode.tsx",
                            lineNumber: 42,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
_c = PlanetaryNode;
var _c;
__turbopack_context__.k.register(_c, "PlanetaryNode");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BatteryNode",
    ()=>BatteryNode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@xyflow/system/dist/esm/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$battery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Battery$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/battery.js [app-client] (ecmascript) <export default as Battery>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx [app-client] (ecmascript)");
"use client";
;
;
;
;
const handles = [
    {
        id: "electrical",
        type: "electrical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Position"].Top,
        label: "Electrical"
    }
];
function BatteryNode(props) {
    const { data } = props;
    const params = data.params;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseNode"], {
        ...props,
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$battery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Battery$3e$__["Battery"], {
            className: "h-4 w-4 text-white"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx",
            lineNumber: 25,
            columnNumber: 13
        }, void 0),
        color: "bg-amber-600",
        handles: handles,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Capacity:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx",
                            lineNumber: 31,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Voltage:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx",
                            lineNumber: 35,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "P max:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx",
                            lineNumber: 39,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "SOC:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx",
                            lineNumber: 43,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
_c = BatteryNode;
var _c;
__turbopack_context__.k.register(_c, "BatteryNode");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "VehicleNode",
    ()=>VehicleNode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@xyflow/system/dist/esm/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/truck.js [app-client] (ecmascript) <export default as Truck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/BaseNode.tsx [app-client] (ecmascript)");
"use client";
;
;
;
;
const handles = [
    {
        id: "wheels",
        type: "mechanical",
        position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$system$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Position"].Left,
        label: "Wheel Input"
    }
];
function VehicleNode(props) {
    const { data } = props;
    const params = data.params;
    const mTotal = (params.mEmpty ?? 159350) + (params.mPayload ?? 190000);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BaseNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseNode"], {
        ...props,
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__["Truck"], {
            className: "h-4 w-4 text-white"
        }, void 0, false, {
            fileName: "[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx",
            lineNumber: 27,
            columnNumber: 13
        }, void 0),
        color: "bg-green-600",
        handles: handles,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Mass:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx",
                            lineNumber: 33,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Wheel R:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx",
                            lineNumber: 37,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Rolling:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx",
                            lineNumber: 41,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "V max:"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx",
                            lineNumber: 45,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
_c = VehicleNode;
var _c;
__turbopack_context__.k.register(_c, "VehicleNode");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/components/nodes/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "nodeTypes",
    ()=>nodeTypes
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$EngineNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/EngineNode.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$MotorNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/MotorNode.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$GearboxNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/GearboxNode.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$PlanetaryNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/PlanetaryNode.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BatteryNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/BatteryNode.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$VehicleNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/VehicleNode.tsx [app-client] (ecmascript)");
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
    engineNode: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$EngineNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EngineNode"],
    motorNode: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$MotorNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MotorNode"],
    gearboxNode: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$GearboxNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GearboxNode"],
    planetaryNode: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$PlanetaryNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlanetaryNode"],
    batteryNode: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$BatteryNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BatteryNode"],
    vehicleNode: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$VehicleNode$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VehicleNode"]
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/components/ui/card.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/lib/utils.ts [app-client] (ecmascript)");
;
;
function Card({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-4 shadow-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/card.tsx",
        lineNumber: 6,
        columnNumber: 5
    }, this);
}
_c = Card;
function CardHeader({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-header",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col gap-1", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/card.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
_c1 = CardHeader;
function CardTitle({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
        "data-slot": "card-title",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-lg font-semibold leading-none", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/card.tsx",
        lineNumber: 29,
        columnNumber: 5
    }, this);
}
_c2 = CardTitle;
function CardDescription({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        "data-slot": "card-description",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-muted-foreground text-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/card.tsx",
        lineNumber: 39,
        columnNumber: 5
    }, this);
}
_c3 = CardDescription;
function CardContent({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-content",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/card.tsx",
        lineNumber: 49,
        columnNumber: 5
    }, this);
}
_c4 = CardContent;
function CardFooter({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "card-footer",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex items-center gap-2", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/card.tsx",
        lineNumber: 55,
        columnNumber: 5
    }, this);
}
_c5 = CardFooter;
;
var _c, _c1, _c2, _c3, _c4, _c5;
__turbopack_context__.k.register(_c, "Card");
__turbopack_context__.k.register(_c1, "CardHeader");
__turbopack_context__.k.register(_c2, "CardTitle");
__turbopack_context__.k.register(_c3, "CardDescription");
__turbopack_context__.k.register(_c4, "CardContent");
__turbopack_context__.k.register(_c5, "CardFooter");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/components/ui/button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]", {
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
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Slot"] : "button";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        "data-slot": "button",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
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
_c = Button;
;
var _c;
__turbopack_context__.k.register(_c, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ComponentPalette",
    ()=>ComponentPalette
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$flame$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Flame$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/flame.js [app-client] (ecmascript) <export default as Flame>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/zap.js [app-client] (ecmascript) <export default as Zap>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Circle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle.js [app-client] (ecmascript) <export default as Circle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$battery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Battery$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/battery.js [app-client] (ecmascript) <export default as Battery>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/truck.js [app-client] (ecmascript) <export default as Truck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/stores/drivetrain-store.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/lib/utils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
const COMPONENT_ITEMS = [
    {
        type: "engine",
        label: "Engine",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$flame$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Flame$3e$__["Flame"], {
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
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__["Zap"], {
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
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
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
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Circle$3e$__["Circle"], {
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
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$battery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Battery$3e$__["Battery"], {
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
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__["Truck"], {
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
    _s();
    const addNode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"])({
        "ComponentPalette.useDrivetrainStore[addNode]": (s)=>s.addNode
    }["ComponentPalette.useDrivetrainStore[addNode]"]);
    const loadPreset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"])({
        "ComponentPalette.useDrivetrainStore[loadPreset]": (s)=>s.loadPreset
    }["ComponentPalette.useDrivetrainStore[loadPreset]"]);
    const clearAll = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"])({
        "ComponentPalette.useDrivetrainStore[clearAll]": (s)=>s.clearAll
    }["ComponentPalette.useDrivetrainStore[clearAll]"]);
    const handleDragStart = (e, type)=>{
        e.dataTransfer.setData("application/reactflow", type);
        e.dataTransfer.effectAllowed = "move";
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-64 flex flex-col gap-4 p-4 bg-dark border-r border-subtle overflow-y-auto",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                        className: "pb-2",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardTitle"], {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                        className: "grid grid-cols-2 gap-2",
                        children: COMPONENT_ITEMS.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                draggable: true,
                                onDragStart: (e)=>handleDragStart(e, item.type),
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col items-center gap-1 p-2 rounded-lg border border-subtle cursor-grab", "hover:border-secondary hover:bg-surface/50 transition-all"),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("p-2 rounded-md text-white", item.color),
                                        children: item.icon
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx",
                                        lineNumber: 56,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                        className: "pb-2",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardTitle"], {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                        className: "flex flex-col gap-2",
                        children: [
                            PRESETS.map((preset)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
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
_s(ComponentPalette, "FMvZDf/cMHL3X+T6Qy83jhig30s=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"]
    ];
});
_c = ComponentPalette;
var _c;
__turbopack_context__.k.register(_c, "ComponentPalette");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/components/ui/input.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Input",
    ()=>Input
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/lib/utils.ts [app-client] (ecmascript)");
;
;
function Input({ className, type, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        type: type,
        "data-slot": "input",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("placeholder:text-muted-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50", "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/input.tsx",
        lineNumber: 6,
        columnNumber: 5
    }, this);
}
_c = Input;
;
var _c;
__turbopack_context__.k.register(_c, "Input");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/components/ui/label.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Label",
    ()=>Label
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$label$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-label/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/lib/utils.ts [app-client] (ecmascript)");
;
;
;
function Label({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$label$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"], {
        "data-slot": "label",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/label.tsx",
        lineNumber: 10,
        columnNumber: 5
    }, this);
}
_c = Label;
;
var _c;
__turbopack_context__.k.register(_c, "Label");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/components/ui/separator.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Separator",
    ()=>Separator
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$separator$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-separator/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/lib/utils.ts [app-client] (ecmascript)");
"use client";
;
;
;
function Separator({ className, orientation = "horizontal", decorative = true, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$separator$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"], {
        "data-slot": "separator",
        decorative: decorative,
        orientation: orientation,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("bg-border shrink-0", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/separator.tsx",
        lineNumber: 14,
        columnNumber: 5
    }, this);
}
_c = Separator;
;
var _c;
__turbopack_context__.k.register(_c, "Separator");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PropertiesPanel",
    ()=>PropertiesPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/input.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/label.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$separator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/separator.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-client] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/stores/drivetrain-store.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
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
    _s();
    const nodes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"])({
        "PropertiesPanel.useDrivetrainStore[nodes]": (s)=>s.nodes
    }["PropertiesPanel.useDrivetrainStore[nodes]"]);
    const selectedNodeId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"])({
        "PropertiesPanel.useDrivetrainStore[selectedNodeId]": (s)=>s.selectedNodeId
    }["PropertiesPanel.useDrivetrainStore[selectedNodeId]"]);
    const updateNodeParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"])({
        "PropertiesPanel.useDrivetrainStore[updateNodeParams]": (s)=>s.updateNodeParams
    }["PropertiesPanel.useDrivetrainStore[updateNodeParams]"]);
    const removeNode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"])({
        "PropertiesPanel.useDrivetrainStore[removeNode]": (s)=>s.removeNode
    }["PropertiesPanel.useDrivetrainStore[removeNode]"]);
    const setSelectedNode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"])({
        "PropertiesPanel.useDrivetrainStore[setSelectedNode]": (s)=>s.setSelectedNode
    }["PropertiesPanel.useDrivetrainStore[setSelectedNode]"]);
    const selectedNode = nodes.find((n)=>n.id === selectedNodeId);
    if (!selectedNode) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-72 p-4 bg-dark border-l border-subtle",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-72 flex flex-col gap-4 p-4 bg-dark border-l border-subtle overflow-y-auto",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                    className: "pb-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                            className: "text-sm flex items-center justify-between",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: selectedNode.data.label
                                }, void 0, false, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx",
                                    lineNumber: 103,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "ghost",
                                    size: "icon-sm",
                                    className: "text-destructive hover:text-destructive hover:bg-destructive/10",
                                    onClick: handleDelete,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
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
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                    className: "space-y-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$separator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Separator"], {}, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx",
                            lineNumber: 116,
                            columnNumber: 11
                        }, this),
                        paramDefs.map((def)=>{
                            const value = params[def.key];
                            const displayValue = Array.isArray(value) ? value.join(", ") : String(value ?? "");
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                        htmlFor: def.key,
                                        className: "text-xs",
                                        children: [
                                            def.label,
                                            def.unit && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
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
_s(PropertiesPanel, "smtpFl/PdcL5XQ1mRZCVXAM4UOU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"]
    ];
});
_c = PropertiesPanel;
var _c;
__turbopack_context__.k.register(_c, "PropertiesPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/components/ui/tabs.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tabs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-tabs/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/lib/utils.ts [app-client] (ecmascript)");
"use client";
;
;
;
function Tabs({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tabs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"], {
        "data-slot": "tabs",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col gap-2", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/tabs.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
}
_c = Tabs;
function TabsList({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tabs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["List"], {
        "data-slot": "tabs-list",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("bg-muted/30 text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-1", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/tabs.tsx",
        lineNumber: 25,
        columnNumber: 5
    }, this);
}
_c1 = TabsList;
function TabsTrigger({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tabs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Trigger"], {
        "data-slot": "tabs-trigger",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all", "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm", "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/tabs.tsx",
        lineNumber: 41,
        columnNumber: 5
    }, this);
}
_c2 = TabsTrigger;
function TabsContent({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tabs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Content"], {
        "data-slot": "tabs-content",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/ui/tabs.tsx",
        lineNumber: 59,
        columnNumber: 5
    }, this);
}
_c3 = TabsContent;
;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "Tabs");
__turbopack_context__.k.register(_c1, "TabsList");
__turbopack_context__.k.register(_c2, "TabsTrigger");
__turbopack_context__.k.register(_c3, "TabsContent");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/stores/simulation-store.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useSimulationStore",
    ()=>useSimulationStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
"use client";
;
const DEFAULT_CONFIG = {
    tEnd: 60,
    dtOutput: 0.1,
    targetVelocity: 12,
    grade: 0.0,
    payloadFraction: 1.0
};
const useSimulationStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])((set)=>({
        config: DEFAULT_CONFIG,
        status: "idle",
        progress: 0,
        error: null,
        result: null,
        rimpullCurves: [],
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
            })
    }));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SimulationPanel",
    ()=>SimulationPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/play.js [app-client] (ecmascript) <export default as Play>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Square$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/square.js [app-client] (ecmascript) <export default as Square>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rotate-ccw.js [app-client] (ecmascript) <export default as RotateCcw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/input.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/label.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/ui/tabs.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/stores/drivetrain-store.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/stores/simulation-store.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
function SimulationPanel() {
    _s();
    const validateTopology = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"])({
        "SimulationPanel.useDrivetrainStore[validateTopology]": (s)=>s.validateTopology
    }["SimulationPanel.useDrivetrainStore[validateTopology]"]);
    const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSimulationStore"])({
        "SimulationPanel.useSimulationStore[config]": (s)=>s.config
    }["SimulationPanel.useSimulationStore[config]"]);
    const setConfig = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSimulationStore"])({
        "SimulationPanel.useSimulationStore[setConfig]": (s)=>s.setConfig
    }["SimulationPanel.useSimulationStore[setConfig]"]);
    const status = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSimulationStore"])({
        "SimulationPanel.useSimulationStore[status]": (s)=>s.status
    }["SimulationPanel.useSimulationStore[status]"]);
    const progress = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSimulationStore"])({
        "SimulationPanel.useSimulationStore[progress]": (s)=>s.progress
    }["SimulationPanel.useSimulationStore[progress]"]);
    const setStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSimulationStore"])({
        "SimulationPanel.useSimulationStore[setStatus]": (s)=>s.setStatus
    }["SimulationPanel.useSimulationStore[setStatus]"]);
    const reset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSimulationStore"])({
        "SimulationPanel.useSimulationStore[reset]": (s)=>s.reset
    }["SimulationPanel.useSimulationStore[reset]"]);
    const handleRunSimulation = ()=>{
        const validation = validateTopology();
        if (!validation.isValid) {
            alert("Invalid topology:\n" + validation.errors.join("\n"));
            return;
        }
        setStatus("running");
        // Simulation will be implemented in next phase
        setTimeout(()=>{
            setStatus("completed");
        }, 2000);
    };
    const handleStop = ()=>{
        setStatus("idle");
        reset();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-64 bg-dark border-t border-subtle p-4 overflow-hidden",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tabs"], {
            defaultValue: "config",
            className: "h-full flex flex-col",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between mb-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TabsList"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TabsTrigger"], {
                                    value: "config",
                                    children: "Configuration"
                                }, void 0, false, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 45,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TabsTrigger"], {
                                    value: "results",
                                    children: "Results"
                                }, void 0, false, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 46,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TabsTrigger"], {
                                    value: "rimpull",
                                    children: "Rimpull"
                                }, void 0, false, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 47,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                            lineNumber: 44,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2",
                            children: [
                                status === "running" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2 text-sm text-muted",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "h-2 w-32 bg-subtle rounded-full overflow-hidden",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "h-full bg-accent transition-all",
                                                style: {
                                                    width: `${progress * 100}%`
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                                lineNumber: 54,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 53,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: [
                                                Math.round(progress * 100),
                                                "%"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 59,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 52,
                                    columnNumber: 15
                                }, this),
                                status !== "running" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "accent",
                                    size: "sm",
                                    onClick: handleRunSimulation,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__["Play"], {
                                            className: "h-4 w-4 mr-1"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 65,
                                            columnNumber: 17
                                        }, this),
                                        "Run Simulation"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 64,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "destructive",
                                    size: "sm",
                                    onClick: handleStop,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Square$3e$__["Square"], {
                                            className: "h-4 w-4 mr-1"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                            lineNumber: 70,
                                            columnNumber: 17
                                        }, this),
                                        "Stop"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 69,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "outline",
                                    size: "sm",
                                    onClick: reset,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                                        className: "h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                        lineNumber: 76,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                    lineNumber: 75,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                            lineNumber: 50,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                    lineNumber: 43,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TabsContent"], {
                    value: "config",
                    className: "flex-1 overflow-auto",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-5 gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                        className: "text-xs",
                                        children: "Duration (s)"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                        lineNumber: 84,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                        type: "number",
                                        value: config.tEnd,
                                        onChange: (e)=>setConfig({
                                                tEnd: parseFloat(e.target.value) || 60
                                            }),
                                        className: "h-8"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                        lineNumber: 85,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                lineNumber: 83,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                        className: "text-xs",
                                        children: "Target Speed (km/h)"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                        lineNumber: 93,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                        type: "number",
                                        value: (config.targetVelocity * 3.6).toFixed(1),
                                        onChange: (e)=>setConfig({
                                                targetVelocity: (parseFloat(e.target.value) || 0) / 3.6
                                            }),
                                        className: "h-8"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                        lineNumber: 94,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                lineNumber: 92,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                        className: "text-xs",
                                        children: "Grade (%)"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                        lineNumber: 102,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                        type: "number",
                                        value: (config.grade * 100).toFixed(1),
                                        onChange: (e)=>setConfig({
                                                grade: (parseFloat(e.target.value) || 0) / 100
                                            }),
                                        step: 0.5,
                                        className: "h-8"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                        lineNumber: 103,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                lineNumber: 101,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                        className: "text-xs",
                                        children: "Payload (%)"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                        lineNumber: 112,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                        type: "number",
                                        value: (config.payloadFraction * 100).toFixed(0),
                                        onChange: (e)=>setConfig({
                                                payloadFraction: (parseFloat(e.target.value) || 100) / 100
                                            }),
                                        className: "h-8"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                        lineNumber: 113,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                lineNumber: 111,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$label$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
                                        className: "text-xs",
                                        children: "Output Step (s)"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                        lineNumber: 121,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                        type: "number",
                                        value: config.dtOutput,
                                        onChange: (e)=>setConfig({
                                                dtOutput: parseFloat(e.target.value) || 0.1
                                            }),
                                        step: 0.05,
                                        className: "h-8"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                        lineNumber: 122,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                                lineNumber: 120,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                        lineNumber: 82,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                    lineNumber: 81,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TabsContent"], {
                    value: "results",
                    className: "flex-1 overflow-auto",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                        className: "h-full",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                            className: "h-full flex items-center justify-center text-muted",
                            children: status === "completed" ? "Simulation complete - charts will appear here" : "Run a simulation to see results"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                            lineNumber: 135,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                        lineNumber: 134,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                    lineNumber: 133,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$tabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TabsContent"], {
                    value: "rimpull",
                    className: "flex-1 overflow-auto",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                        className: "h-full",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                            className: "h-full flex items-center justify-center text-muted",
                            children: "Rimpull curves will appear here"
                        }, void 0, false, {
                            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                            lineNumber: 145,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                        lineNumber: 144,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
                    lineNumber: 143,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
            lineNumber: 42,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx",
        lineNumber: 41,
        columnNumber: 5
    }, this);
}
_s(SimulationPanel, "wG/Bwr+6OxMMBjT4VaFMGxP24mY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSimulationStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSimulationStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSimulationStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSimulationStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSimulationStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$simulation$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSimulationStore"]
    ];
});
_c = SimulationPanel;
var _c;
__turbopack_context__.k.register(_c, "SimulationPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DrivetrainEditor",
    ()=>DrivetrainEditor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@xyflow/react/dist/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/stores/drivetrain-store.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/nodes/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$panels$2f$ComponentPalette$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/panels/ComponentPalette.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$panels$2f$PropertiesPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/panels/PropertiesPanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$panels$2f$SimulationPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/panels/SimulationPanel.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
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
    _s();
    const nodes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"])({
        "DrivetrainEditor.useDrivetrainStore[nodes]": (s)=>s.nodes
    }["DrivetrainEditor.useDrivetrainStore[nodes]"]);
    const edges = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"])({
        "DrivetrainEditor.useDrivetrainStore[edges]": (s)=>s.edges
    }["DrivetrainEditor.useDrivetrainStore[edges]"]);
    const onNodesChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"])({
        "DrivetrainEditor.useDrivetrainStore[onNodesChange]": (s)=>s.onNodesChange
    }["DrivetrainEditor.useDrivetrainStore[onNodesChange]"]);
    const onEdgesChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"])({
        "DrivetrainEditor.useDrivetrainStore[onEdgesChange]": (s)=>s.onEdgesChange
    }["DrivetrainEditor.useDrivetrainStore[onEdgesChange]"]);
    const addNode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"])({
        "DrivetrainEditor.useDrivetrainStore[addNode]": (s)=>s.addNode
    }["DrivetrainEditor.useDrivetrainStore[addNode]"]);
    const addEdge_ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"])({
        "DrivetrainEditor.useDrivetrainStore[addEdge_]": (s)=>s.addEdge
    }["DrivetrainEditor.useDrivetrainStore[addEdge_]"]);
    const setSelectedNode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"])({
        "DrivetrainEditor.useDrivetrainStore[setSelectedNode]": (s)=>s.setSelectedNode
    }["DrivetrainEditor.useDrivetrainStore[setSelectedNode]"]);
    const onConnect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DrivetrainEditor.useCallback[onConnect]": (connection)=>{
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
        }
    }["DrivetrainEditor.useCallback[onConnect]"], [
        addEdge_
    ]);
    const onDragOver = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DrivetrainEditor.useCallback[onDragOver]": (event)=>{
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
        }
    }["DrivetrainEditor.useCallback[onDragOver]"], []);
    const onDrop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DrivetrainEditor.useCallback[onDrop]": (event)=>{
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
        }
    }["DrivetrainEditor.useCallback[onDrop]"], [
        addNode
    ]);
    const onPaneClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DrivetrainEditor.useCallback[onPaneClick]": ()=>{
            setSelectedNode(null);
        }
    }["DrivetrainEditor.useCallback[onPaneClick]"], [
        setSelectedNode
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-screen flex flex-col bg-black",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "h-14 flex items-center px-4 border-b border-subtle bg-dark",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-lg font-semibold text-primary",
                        children: "Gearbox Analyzer"
                    }, void 0, false, {
                        fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                        lineNumber: 98,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "ml-4 text-sm text-muted",
                        children: "Visual Drivetrain Simulation Tool"
                    }, void 0, false, {
                        fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                        lineNumber: 99,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                lineNumber: 97,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 flex overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$panels$2f$ComponentPalette$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ComponentPalette"], {}, void 0, false, {
                        fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                        lineNumber: 107,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 flex flex-col",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ReactFlow"], {
                                    nodes: nodes,
                                    edges: edges,
                                    onNodesChange: onNodesChange,
                                    onEdgesChange: onEdgesChange,
                                    onConnect: onConnect,
                                    onDragOver: onDragOver,
                                    onDrop: onDrop,
                                    onPaneClick: onPaneClick,
                                    nodeTypes: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$nodes$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["nodeTypes"],
                                    edgeTypes: edgeTypes,
                                    defaultEdgeOptions: defaultEdgeOptions,
                                    fitView: true,
                                    proOptions: {
                                        hideAttribution: true
                                    },
                                    className: "bg-black",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Background"], {
                                            variant: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["BackgroundVariant"].Dots,
                                            gap: 20,
                                            size: 1,
                                            color: "#2a2a2a"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                                            lineNumber: 128,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Controls"], {
                                            className: "bg-surface border-subtle [&>button]:bg-surface [&>button]:border-subtle [&>button]:text-primary [&>button:hover]:bg-subtle"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                                            lineNumber: 134,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$xyflow$2f$react$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["MiniMap"], {
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
                                            lineNumber: 135,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                                    lineNumber: 112,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                                lineNumber: 111,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$panels$2f$SimulationPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SimulationPanel"], {}, void 0, false, {
                                fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                                lineNumber: 160,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                        lineNumber: 110,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$panels$2f$PropertiesPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PropertiesPanel"], {}, void 0, false, {
                        fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                        lineNumber: 164,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
                lineNumber: 105,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx",
        lineNumber: 95,
        columnNumber: 5
    }, this);
}
_s(DrivetrainEditor, "GNs0fgvZCDE3cnhrrlIkgjKVdDo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$stores$2f$drivetrain$2d$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDrivetrainStore"]
    ];
});
_c = DrivetrainEditor;
var _c;
__turbopack_context__.k.register(_c, "DrivetrainEditor");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/gearbox-analyzer/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$DrivetrainEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/gearbox-analyzer/components/DrivetrainEditor.tsx [app-client] (ecmascript)");
"use client";
;
;
function Home() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$gearbox$2d$analyzer$2f$components$2f$DrivetrainEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DrivetrainEditor"], {}, void 0, false, {
        fileName: "[project]/apps/gearbox-analyzer/app/page.tsx",
        lineNumber: 6,
        columnNumber: 10
    }, this);
}
_c = Home;
var _c;
__turbopack_context__.k.register(_c, "Home");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=apps_gearbox-analyzer_43a3b3fa._.js.map