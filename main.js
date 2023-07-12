const app = new PIXI.Application({ width: 800, height: 600 });
const appContainer = document.getElementById("appContainer");
appContainer.appendChild(app.view);

const fuck = new PIXI.Text("Hello.");
fuck.style.fill = ["#ffffff"];

const fuck2 = new PIXI.Text("World");
fuck2.style.fill = ["#ff00ff"];
fuck2.position.set(100, 100);

const fuck3 = PIXI.Sprite.from("asset/sprite.png");
fuck3.position.set(200, 200);

const SceneEdit = {
    selectIndicator: null,
    selectedIndicator: null,
    gridLines: null,

    indicatedObj: null,
    selectedObj: null,
    indicatedRect: null,
    selectedRect: null,

    root: null,
    objTypeMap: null,

    grid: true,
    gridX: 32,
    gridY: 32,

    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragOffsetX: 0,
    dragOffsetY: 0,
    altHeld: false,

    actions: [],
    actionIndex: 0,
    actionLength: 0,

    init() {
        this.selectIndicator = new PIXI.Graphics();
        this.selectIndicator.visible = false;

        this.selectedIndicator = new PIXI.Graphics();
        this.selectedIndicator.visible = false;

        this.gridLines = new PIXI.Graphics();
        this.redrawGridLines();

        app.stage.addChild(this.selectIndicator);
        app.stage.addChild(this.selectedIndicator);
        app.stage.addChild(this.gridLines);

        this.root = new PIXI.Container();
        app.stage.addChild(this.root);

        this.objTypeMap = new Map();
    },

    addObject(type, obj) {
        this.root.addChild(obj);
        this.objTypeMap.set(obj, type);
    },
    getObjectType(obj) {
        return this.objTypeMap.get(obj);
    },

    /**
     * 
     * @param {MouseEvent} e 
     */
    handleMouseMove(e) {
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;
        if (this.dragging) {
            // 拖动到新位置
            const dragMousePos = this.altHeld ? {
                x: mouseX,
                y: mouseY,
            } : this.getGridPos(mouseX, mouseY);
            
            this.setProperty(this.selectedObj, "position.x", dragMousePos.x - this.dragOffsetX);
            this.setProperty(this.selectedObj, "position.y", dragMousePos.y - this.dragOffsetY);

            this.updateSelectedPos();
        } else findIndicatedLoop: {
            for (const obj of this.root.children) {
                const bounds = obj.getBounds();
                if (mouseX >= bounds.x && mouseY >= bounds.y && mouseX < bounds.x + bounds.width && mouseY < bounds.y + bounds.height) {
                    this.indicateRect(bounds);
                    this.indicatedObj = obj;
                    break findIndicatedLoop;
                }
            }
            this.hideIndicator();
        }
    },
    /**
     * 
     * @param {MouseEvent} e 
     */
    handleMouseDown(e) {
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;

        if (e.button == 0) {
            // 左键
            if (this.selectIndicator.visible) {
                // 指向物体中，选中该物体
                if (this.selectedObj != this.indicatedObj) {
                    this.pushAction({
                        type: "select",
                        before: this.selectedObj,
                        after: this.indicatedObj
                    });

                    this.selectObject(this.indicatedObj);
                }
                this.selectIndicator.visible = false;

                this.dragging = true;
                this.dragStartX = this.selectedObj.x;
                this.dragStartY = this.selectedObj.y;
                const dragMousePos = this.getGridPos(mouseX, mouseY);
                this.dragOffsetX = dragMousePos.x - this.selectedObj.x;
                this.dragOffsetY = dragMousePos.y - this.selectedObj.y;
            }
        } else if (e.button == 2) {
            // 右键
            if (this.selectedObj != null) {
                this.pushAction({
                    type: "select",
                    before: this.selectedObj,
                    after: null
                });

                this.selectedObj = null;
                this.hideSelectedIndicator();

                HtmlDoc.updateSelectedObject(null);
            }
        }
    },
    /**
     * 
     * @param {MouseEvent} e 
     */
    handleMouseUp(e) {
        if (this.dragging) {
            this.dragging = false;
            if (this.selectedObj.x != this.dragStartX || this.selectedObj.y != this.dragStartY) {
                // 位置变化，记录拖动
                this.pushAction({
                    type: "drag",
                    object: this.selectedObj,
                    before: {
                        x: this.dragStartX,
                        y: this.dragStartY
                    },
                    after: {
                        x: this.selectedObj.x,
                        y: this.selectedObj.y
                    }
                });
            }
        }
    },
    /**
     * 
     * @param {KeyboardEvent} e 
     */
    handleKeyDown(e) {
        if (e.code == "AltLeft") {
            this.altHeld = true;
            e.preventDefault();
        } else if (e.code == "AltRight") {
            e.preventDefault();
        }
        if (e.key == "z" || e.key == "Z") {
            if (e.ctrlKey) {
                this.undo();
            }
        } else if (e.key == "y" || e.key == "Y") {
            if (e.ctrlKey) {
                this.redo();
            }
        }
    },
    /**
     * 
     * @param {KeyboardEvent} e 
     */
    handleKeyUp(e) {
        this.altHeld = false;
    },

    selectObject(obj) {
        this.selectedObj = obj;
        if (obj != null) {
            const bounds = obj.getBounds();
            this.selectedRect = {
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height,
            };

            this.selectedIndicator.visible = true;
            this.redrawSelectedIndicator();

            HtmlDoc.updateSelectedObject({
                type: this.getObjectType(obj),
                object: obj
            });
        } else {
            this.hideSelectedIndicator();

            HtmlDoc.updateSelectedObject(null);
        }
    },

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {{x: number, y: number}}
     */
    getGridPos(x, y) {
        if (this.grid) {
            x = this.gridX * Math.floor(x / this.gridX);
            y = this.gridY * Math.floor(y / this.gridY);
        }
        return {
            x: x,
            y: y
        };
    },

    handlePropChange(propName) {
        // 检查边界范围变化，更新
        const bounds = this.selectedObj.getBounds();
        if (this.selectedRect.x != bounds.x || this.selectedRect.y != bounds.y || this.selectedRect.width != bounds.width || this.selectedRect.height != bounds.height) {
            this.selectedRect = {
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height,
            };
            this.redrawSelectedIndicator();
        }
    },

    pushAction(action) {
        this.actions[this.actionIndex] = action;
        ++this.actionIndex;
        this.actionLength = this.actionIndex;
    },
    undo() {
        if (this.actionIndex >= 1) {
            --this.actionIndex;
            const action = this.actions[this.actionIndex];
            const type = action.type;
            if (type == "select") {
                const before = action.before;

                this.selectObject(before);
            } else if (type == "drag") {
                const object = action.object;
                const before = action.before;

                this.setProperty(object, "position.x", before.x);
                this.setProperty(object, "position.y", before.y);
                this.updateSelectedPos();
            }
        }
    },
    redo() {
        if (this.actionIndex < this.actionLength) {
            const action = this.actions[this.actionIndex];
            const type = action.type;
            if (type == "select") {
                const after = action.after;

                this.selectObject(after);
            } else if (type == "drag") {
                const object = action.object;
                const after = action.after;

                this.setProperty(object, "position.x", after.x);
                this.setProperty(object, "position.y", after.y);
                this.updateSelectedPos();
            }

            ++this.actionIndex;
        }
    },

    indicateRect(rect) {
        this.indicatedRect = rect;

        this.selectIndicator.clear();
        this.selectIndicator.lineStyle(1, "#ffff00", 0.5);
        this.selectIndicator.beginFill("#000000", 0);
        this.selectIndicator.drawRect(0, -1, rect.width + 1, rect.height + 1);
        this.selectIndicator.endFill();

        this.selectIndicator.visible = true;
        this.selectIndicator.x = rect.x;
        this.selectIndicator.y = rect.y;
    },
    hideIndicator() {
        this.selectIndicator.visible = false;
    },
    hideSelectedIndicator() {
        this.selectedIndicator.visible = false;
    },
    updateSelectedPos() {
        const bounds = this.selectedObj.getBounds();
        this.selectedIndicator.position.set(bounds.x, bounds.y);
        this.selectedRect.x = bounds.x;
        this.selectedRect.y = bounds.y;
    },
    redrawSelectedIndicator() {
        this.selectedIndicator.clear();
        this.selectedIndicator.lineStyle(1, "#ffff00", 1);
        this.selectedIndicator.beginFill("#000000", 0);
        this.selectedIndicator.drawRect(0, -1, this.selectedRect.width + 1, this.selectedRect.height + 1);
        this.selectedIndicator.endFill();

        this.selectedIndicator.visible = true;
        this.selectedIndicator.x = this.selectedRect.x;
        this.selectedIndicator.y = this.selectedRect.y;
    },
    redrawGridLines() {
        this.gridLines.clear();
        this.gridLines.lineStyle(1, "#ffffff", 0.5);
        for (let i = 0; i < 800; i += this.gridX) {
            this.gridLines.moveTo(i + 1, 0);
            this.gridLines.lineTo(i + 1, 600);
        }
        for (let i = 0; i < 600; i += this.gridY) {
            this.gridLines.moveTo(0, i);
            this.gridLines.lineTo(800, i);
        }
    },

    setProperty(obj, propName, val) {
        const nameList = propName.split(".");
        let changed = obj;
        for (let i = 0, length = nameList.length; i < length; ++i) {
            const name = nameList[i];
            if (i < length - 1) {
                changed = changed[name];
            } else {
                changed[name] = val;
            }
        }
    
        // inspector响应
        HtmlDoc.updateProperty(propName, val);
    },

    setGrid(val) {
        this.grid = val;
        this.gridLines.visible = val;
    },

    setGridX(val) {
        if (this.gridX != val) {
            this.gridX = val;
            this.redrawGridLines();
        }
    },

    setGridY(val) {
        if (this.gridY != val) {
            this.gridY = val;
            this.redrawGridLines();
        }
    }
};
SceneEdit.init();

SceneEdit.addObject("Text", fuck);
SceneEdit.addObject("Text", fuck2);
SceneEdit.addObject("Sprite", fuck3);

const Data = {
    types: null,
    typeDataMap: null,

    init() {
        this.types = ["Text", "Sprite"];
        this.typeDataMap = new Map();
        this.typeDataMap.set("Text", {
            image: "asset/text.png",
            text: "PIXI.Text",
            assetName: "Text",
            properties: [
                {
                    name: "position",
                    type: "object",
                    children: [
                        {
                            name: "x",
                            type: "number"
                        },
                        {
                            name: "y",
                            type: "number"
                        }
                    ]
                },
                {
                    name: "text",
                    type: "multiline",
                },
                {
                    name: "angle",
                    type: "number"
                },
                {
                    name: "scale",
                    type: "object",
                    children: [
                        {
                            name: "x",
                            type: "number"
                        },
                        {
                            name: "y",
                            type: "number"
                        }
                    ]
                },
                {
                    name: "anchor",
                    type: "object",
                    children: [
                        {
                            name: "x",
                            type: "number"
                        },
                        {
                            name: "y",
                            type: "number"
                        }
                    ]
                },
                {
                    name: "zIndex",
                    type: "number"
                },
                {
                    name: "style",
                    type: "object",
                    children: [
                        {
                            name: "fontFamily",
                            type: "string"
                        },
                        {
                            name: "fontSize",
                            type: "string|number"
                        },
                        {
                            name: "fontStyle",
                            type: "enum",
                            options: [
                                "normal",
                                "italic",
                                "oblique"
                            ]
                        },
                        {
                            name: "fontVariant",
                            type: "enum",
                            options: [
                                "normal",
                                "small-caps"
                            ]
                        },
                        {
                            name: "fontWeight",
                            type: "enum",
                            options: [
                                "normal",
                                "bold",
                                "bolder",
                                "lighter",
                                "100",
                                "200",
                                "300",
                                "400",
                                "500",
                                "600",
                                "700",
                                "800",
                                "900"
                            ]
                        },
                        {
                            name: "align",
                            type: "enum",
                            options: [
                                "left",
                                "center",
                                "right",
                                "justify"
                            ]
                        },
                        {
                            name: "textBaseline",
                            type: "enum",
                            options: [
                                "alphabetic",
                                "top",
                                "hanging",
                                "middle",
                                "ideographic",
                                "bottom"
                            ]
                        },
                        {
                            name: "wordWrap",
                            type: "boolean"
                        },
                        {
                            name: "breakWords",
                            type: "boolean"
                        },
                        {
                            name: "wordWrapWidth",
                            type: "number"
                        },
                        {
                            name: "lineHeight",
                            type: "number"
                        },
                        {
                            name: "lineJoin",
                            type: "enum",
                            options: [
                                "miter",
                                "round",
                                "bevel"
                            ]
                        },
                        {
                            name: "miterLimit",
                            type: "number"
                        },
                        {
                            name: "padding",
                            type: "number"
                        },
                        {
                            name: "trim",
                            type: "boolean"
                        },
                        {
                            name: "whiteSpace",
                            type: "enum",
                            options: [
                                "normal",
                                "pre",
                                "pre-line"
                            ]
                        },
                        {
                            name: "fill",
                            type: "array",
                            elementType: "string",
                            minLength: 1
                        },
                        {
                            name: "stroke",
                            type: "string"
                        },
                        {
                            name: "strokeThickness",
                            type: "number"
                        },
                        {
                            name: "dropShadow",
                            type: "boolean"
                        },
                        {
                            name: "dropShadowColor",
                            type: "string"
                        },
                        {
                            name: "dropShadowAlpha",
                            type: "number"
                        },
                        {
                            name: "dropShadowAngle",
                            type: "radian"
                        },
                        {
                            name: "dropShadowBlur",
                            type: "number"
                        },
                        {
                            name: "dropShadowDistance",
                            type: "number"
                        }
                    ]
                }
            ]
        });
        this.typeDataMap.set("Sprite", {
            image: "asset/sprite.png",
            text: "PIXI.Sprite",
            assetName: "Sprite",
            properties: [
                {
                    name: "position",
                    type: "object",
                    children: [
                        {
                            name: "x",
                            type: "number"
                        },
                        {
                            name: "y",
                            type: "number"
                        }
                    ]
                },
                {
                    name: "angle",
                    type: "number"
                },
                {
                    name: "scale",
                    type: "object",
                    children: [
                        {
                            name: "x",
                            type: "number"
                        },
                        {
                            name: "y",
                            type: "number"
                        }
                    ]
                },
                {
                    name: "anchor",
                    type: "object",
                    children: [
                        {
                            name: "x",
                            type: "number"
                        },
                        {
                            name: "y",
                            type: "number"
                        }
                    ]
                },
                {
                    name: "zIndex",
                    type: "number"
                }
            ]
        });
    },
    getTypeImage(type) {
        return this.typeDataMap.get(type).image;
    },
    getTypeText(type) {
        return this.typeDataMap.get(type).text;
    },
    getTypeAssetName(type) {
        return this.typeDataMap.get(type).assetName;
    },
    getTypeProperties(type) {
        return this.typeDataMap.get(type).properties;
    }
};
Data.init();

const HtmlDoc = {
    /**
     * @type {HTMLDivElement}
     */
    inspectorContent: null,
    /**
     * @type {Map<string, {type: string, elem: HTMLElement}>}
     */
    propElemMap: null,

    /**
     * @type {HTMLInputElement}
     */
    gridInput: null,
    /**
     * @type {HTMLInputElement}
     */
    gridXInput: null,
    /**
     * @type {HTMLInputElement}
     */
    gridYInput: null,

    /**
     * @type {HTMLDivElement}
     */
    assetContent: null,
    /**
     * @type {HTMLSpanElement}
     */
    selectedAssetBlock: null,
    /**
     * @type {string}
     */
    selectedAssetName: "",

    init() {
        this.inspectorContent = document.getElementById("inspectorContent");
        this.propElemMap = new Map();

        this.gridInput = document.getElementById("gridInput");
        this.gridXInput = document.getElementById("gridXInput");
        this.gridYInput = document.getElementById("gridYInput");

        this.gridInput.addEventListener("change", e => {
            SceneEdit.setGrid(e.target.checked);
        });
        this.gridXInput.addEventListener("change", e => {
            SceneEdit.setGridX(e.target.valueAsNumber);
        });
        this.gridYInput.addEventListener("change", e => {
            SceneEdit.setGridY(e.target.valueAsNumber);
        });

        // 创建资源浏览界面
        this.assetContent = document.getElementById("assetContent");
        for (const type of Data.types) {
            const block = document.createElement("span");
            block.className = "assetBlock";
        
            const img = document.createElement("img");
            img.src = Data.getTypeImage(type);
            const br = document.createElement("br");
            const text = document.createTextNode(Data.getTypeAssetName(type));
        
            block.appendChild(img);
            block.appendChild(br);
            block.appendChild(text);
        
            block.addEventListener("mouseenter", e => {
                if (this.selectedAssetBlock != block) {
                    block.style.backgroundColor = "#adfff280";
                }
            });
            block.addEventListener("mouseleave", e => {
                if (this.selectedAssetBlock != block) {
                    block.style.backgroundColor = "transparent";
                }
            });
            block.addEventListener("mousedown", e => {
                if (this.selectedAssetBlock != null) {
                    this.selectedAssetBlock.style.backgroundColor = "transparent";
                }
        
                this.selectedAssetBlock = block;
                block.style.backgroundColor = "#adfff2";

                this.selectedAssetName = type;
            });
        
            this.assetContent.appendChild(block);
        }
    },
    /**
     * 
     * @param {{type: string, obj: object}?} typedObject 
     */
    updateSelectedObject(typedObject) {
        this.inspectorContent.innerHTML = "";

        if (typedObject != null) {
            const type = typedObject.type;

            const img = document.createElement("img");
            img.src = Data.getTypeImage(type);

            const typeTextSpan = document.createElement("span");
            typeTextSpan.className = "object-type";
            typeTextSpan.innerHTML = Data.getTypeText(type);

            const br = document.createElement("br");
            
            this.inspectorContent.appendChild(img);
            this.inspectorContent.appendChild(typeTextSpan);
            this.inspectorContent.appendChild(br);

            this.createPropElemTree(this.inspectorContent, Data.getTypeProperties(type), typedObject.object, "");
        }
    },
    /**
     * 
     * @param {HTMLDivElement} parentDiv 
     * @param {object} properties 
     * @param {object} changed 
     * @param {string} namePrefix 
     */
    createPropElemTree(parentDiv, properties, changed, namePrefix) {
        for (const property of properties) {
            // 根据属性类型创建所需元素，加入map
            const type = property.type;
            const propName = property.name;
            const fullName = namePrefix + propName;

            if (type == "string" || type == "number" || type == "string|number" || type == "radian" || type == "boolean" || type == "array") {
                const nameTextNode = document.createTextNode(`${propName}: `);
                const valueInput = document.createElement("input");
                const br = document.createElement("br");
                let changeFun;

                if (type == "string") {
                    valueInput.value = changed[propName];
                    changeFun = e => {
                        changed[propName] = e.target.value;
                        SceneEdit.handlePropChange(fullName);
                    };
                } else if (type == "number") {
                    valueInput.type = "number";
                    valueInput.value = changed[propName].toString();
                    changeFun = e => {
                        changed[propName] = e.target.valueAsNumber;
                        SceneEdit.handlePropChange(fullName);
                    };
                } else if (type == "string|number") {
                    valueInput.value = changed[propName].toString();
                    changeFun = e => {
                        const newValue = parseFloat(e.target.value);
                        if (!isNaN(newValue)) {
                            changed[propName] = newValue;
                        } else {
                            changed[propName] = e.target.value;
                        }
                        SceneEdit.handlePropChange(fullName);
                    };
                } else if (type == "radian") {
                    valueInput.type = "number";
                    valueInput.value = (180 * changed[propName] / Math.PI).toString();
                    changeFun = e => {
                        const rad = e.target.valueAsNumber * Math.PI / 180;
                        changed[propName] = rad;
                        SceneEdit.handlePropChange(fullName);
                    };
                } else if (type == "boolean") {
                    valueInput.type = "checkbox";
                    valueInput.checked = changed[propName];
                    changeFun = e => {
                        changed[propName] = e.target.checked;
                        SceneEdit.handlePropChange(fullName);
                    };
                } else {
                    valueInput.value = changed[propName].join(",");
                    changeFun = e => {
                        if (e.target.value != "") {
                            const stringList = e.target.value.split(",");
                            if (stringList.length >= property.minLength) {
                                changed[propName] = [];
                                for (const str of stringList) {
                                    changed[propName].push(str);
                                }
                                SceneEdit.handlePropChange(fullName);
                            }
                        }
                    };
                }
                valueInput.addEventListener("change", changeFun);

                this.propElemMap.set(fullName, {
                    type: type,
                    element: valueInput
                });

                parentDiv.appendChild(nameTextNode);
                parentDiv.appendChild(valueInput);
                parentDiv.appendChild(br);
            } else if (type == "multiline") {
                const nameSpan = document.createElement("span");
                const valueTextArea = document.createElement("textarea");
                const br = document.createElement("br");

                nameSpan.className = "property-name";
                nameSpan.innerHTML = `${propName}: `;

                valueTextArea.value = changed[propName];
                valueTextArea.addEventListener("change", e => {
                    changed[propName] = e.target.value;
                    SceneEdit.handlePropChange(fullName);
                });

                this.propElemMap.set(namePrefix + propName, {
                    type: type,
                    element: valueTextArea
                });

                parentDiv.appendChild(nameSpan);
                parentDiv.appendChild(valueTextArea);
                parentDiv.appendChild(br);
            } else if (type == "enum") {
                const nameTextNode = document.createTextNode(`${propName}: `);
                const valueSelect = document.createElement("select");
                const br = document.createElement("br");

                for (const option of property.options) {
                    const optionElem = document.createElement("option");
                    optionElem.innerHTML = option;
                    valueSelect.appendChild(optionElem);
                }
                valueSelect.value = changed[propName];
                valueSelect.addEventListener("change", e => {
                    changed[propName] = e.target.value;
                    SceneEdit.handlePropChange(fullName);
                });

                this.propElemMap.set(namePrefix + propName, {
                    type: type,
                    element: valueSelect
                });

                parentDiv.appendChild(nameTextNode);
                parentDiv.appendChild(valueSelect);
                parentDiv.appendChild(br);
            } else if (type == "object") {
                const nameDiv = document.createElement("div");
                nameDiv.className = "object-property";
                nameDiv.innerHTML = `▼${propName}:`;

                const propertiesDiv = document.createElement("div");
                propertiesDiv.className = "property-list";

                nameDiv.addEventListener("click", e => {
                    if (propertiesDiv.style.display == "none") {
                        e.target.innerHTML = `▼${propName}:`;
                        propertiesDiv.style.display = "block";
                    } else {
                        e.target.innerHTML = `▶${propName}`;
                        propertiesDiv.style.display = "none";
                    }
                });

                // 递归创建属性树
                this.createPropElemTree(propertiesDiv, property.children, changed[propName], `${propName}.`);

                parentDiv.appendChild(nameDiv);
                parentDiv.appendChild(propertiesDiv);
            }
        }
    },
    updateProperty(propName, val) {
        const typeElem = this.propElemMap.get(propName);
        const type = typeElem.type;
        const element = typeElem.element;
        if (type == "number") {
            element.value = val.toString();
        } else if (type == "string") {
            element.value = val;
        }
    }
};
HtmlDoc.init();

app.view.addEventListener("mousemove", e => {
    SceneEdit.handleMouseMove(e);
});
app.view.addEventListener("mousedown", e => {
    SceneEdit.handleMouseDown(e);
});
app.view.addEventListener("mouseup", e => {
    SceneEdit.handleMouseUp(e);
});
document.addEventListener("keydown", e => {
    if (e.target == document.body) {
        SceneEdit.handleKeyDown(e);
    }
});
document.addEventListener("keyup", e => {
    if (e.target == document.body) {
        SceneEdit.handleKeyUp(e);
    }
});
app.view.addEventListener("contextmenu", e => {
    e.preventDefault();
});