const app = new PIXI.Application({ width: 800, height: 600 });
const appContainer = document.getElementById("appContainer");
appContainer.appendChild(app.view);

const fuck = new PIXI.Text("Hello.");
fuck.style.fill = ["#ffffff"];

app.stage.addChild(fuck);

const selectIndicator = {
    graphics: new PIXI.Graphics(),
    indicateRect(rect) {
        this.graphics.clear();
        this.graphics.lineStyle(1, "#ffff00", 0.5);
        this.graphics.beginFill("#000000", 0);
        this.graphics.drawRect(0, -1, rect.width + 1, rect.height + 1);
        this.graphics.endFill();

        this.graphics.visible = true;
        this.graphics.x = rect.x;
        this.graphics.y = rect.y;
    },
    hide() {
        this.graphics.visible = false;
    }
};
app.stage.addChild(selectIndicator.graphics);

const fuckProperties = [
    {
        name: "position",
        type: "object",
        children: [
            {
                name: "x",
                type: "number",
                defaultValue: 0
            },
            {
                name: "y",
                type: "number",
                defaultValue: 0
            }
        ]
    },
    {
        name: "text",
        type: "string",
        defaultValue: "Hello."
    },
    {
        name: "angle",
        type: "number",
        defaultValue: 0
    },
    {
        name: "scale",
        type: "object",
        children: [
            {
                name: "x",
                type: "number",
                defaultValue: 1
            },
            {
                name: "y",
                type: "number",
                defaultValue: 1
            }
        ]
    },
    {
        name: "anchor",
        type: "object",
        children: [
            {
                name: "x",
                type: "number",
                defaultValue: 0
            },
            {
                name: "y",
                type: "number",
                defaultValue: 0
            }
        ]
    },
    {
        name: "style",
        type: "object",
        children: [
            {
                name: "fontFamily",
                type: "string",
                defaultValue: "Arial"
            },
            {
                name: "fontSize",
                type: "string|number",
                defaultValue: 26
            },
            {
                name: "fontStyle",
                type: "enum",
                options: [
                    "normal",
                    "italic",
                    "oblique"
                ],
                defaultValue: "normal"
            },
            {
                name: "fontVariant",
                type: "enum",
                options: [
                    "normal",
                    "small-caps"
                ],
                defaultValue: "normal"
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
                ],
                defaultValue: "normal"
            },
            {
                name: "align",
                type: "enum",
                options: [
                    "left",
                    "center",
                    "right",
                    "justify"
                ],
                defaultValue: "left"
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
                ],
                defaultValue: "alphabetic"
            },
            {
                name: "wordWrap",
                type: "boolean",
                defaultValue: false
            },
            {
                name: "breakWords",
                type: "boolean",
                defaultValue: false
            },
            {
                name: "wordWrapWidth",
                type: "number",
                defaultValue: 100
            },
            {
                name: "lineHeight",
                type: "number",
                defaultValue: 0
            },
            {
                name: "lineJoin",
                type: "enum",
                options: [
                    "miter",
                    "round",
                    "bevel"
                ],
                defaultValue: "miter"
            },
            {
                name: "miterLimit",
                type: "number",
                defaultValue: 10
            },
            {
                name: "padding",
                type: "number",
                defaultValue: 0
            },
            {
                name: "trim",
                type: "boolean",
                defaultValue: false
            },
            {
                name: "whiteSpace",
                type: "enum",
                options: [
                    "normal",
                    "pre",
                    "pre-line"
                ],
                defaultValue: "pre"
            },
            {
                name: "fill",
                type: "array",
                elementType: "string",
                minLength: 1,
                defaultValue: ["#ffffff"]
            },
            {
                name: "stroke",
                type: "string",
                defaultValue: "#000000"
            },
            {
                name: "strokeThickness",
                type: "number",
                defaultValue: 0
            },
            {
                name: "dropShadow",
                type: "boolean",
                defaultValue: false
            },
            {
                name: "dropShadowColor",
                type: "string",
                defaultValue: "#000000"
            },
            {
                name: "dropShadowAlpha",
                type: "number",
                defaultValue: 1
            },
            {
                name: "dropShadowAngle",
                type: "radian",
                defaultValue: 30
            },
            {
                name: "dropShadowBlur",
                type: "number",
                defaultValue: 0
            },
            {
                name: "dropShadowDistance",
                type: "number",
                defaultValue: 5
            }
        ]
    }
];
const inspectorContent = document.getElementById("inspectorContent");
const propElemMap = new Map();
createPropUITree(inspectorContent, fuckProperties, fuck, "");

// 创建资源界面
const assetConfig = [
    {
        imageSrc: "asset/text.png",
        text: "Text",
    },
    {
        imageSrc: "asset/sprite.png",
        text: "Sprite"
    }
];
const assetContent = document.getElementById("assetContent");
let selectedAssetBlock = null;
for (const conf of assetConfig) {
    const block = document.createElement("span");
    block.className = "assetBlock";

    const img = document.createElement("img");
    img.src = conf.imageSrc;
    const br = document.createElement("br");
    const text = document.createTextNode(conf.text);

    block.appendChild(img);
    block.appendChild(br);
    block.appendChild(text);

    block.addEventListener("mouseenter", e => {
        if (selectedAssetBlock != block) {
            block.style.backgroundColor = "#adfff280";
        }
    });
    block.addEventListener("mouseleave", e => {
        if (selectedAssetBlock != block) {
            block.style.backgroundColor = "transparent";
        }
    });
    block.addEventListener("mousedown", e => {
        if (selectedAssetBlock != null) {
            selectedAssetBlock.style.backgroundColor = "transparent";
        }

        selectedAssetBlock = block;
        block.style.backgroundColor = "#adfff2";
    });

    assetContent.appendChild(block);
}

app.view.addEventListener("mousemove", e => {
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;

    const bounds = fuck.getBounds();
    if (mouseX >= bounds.x && mouseY >= bounds.y && mouseX < bounds.x + bounds.width && mouseY < bounds.y + bounds.height) {
        selectIndicator.indicateRect(bounds);
    } else {
        selectIndicator.hide();
    }
});

function createPropUITree(parentDiv, properties, changed, namePrefix) {
    for (const property of properties) {
        const type = property.type;

        if (type == "string" || type == "number" || type == "string|number" || type == "radian" || type == "boolean" || type == "array") {
            const nameTextNode = document.createTextNode(`${property.name}: `);
            const valueInput = document.createElement("input");
            const br = document.createElement("br");
            let changeFun;

            if (type == "string") {
                valueInput.value = property.defaultValue;
                changeFun = e => {
                    changed[property.name] = e.target.value;
                };
            } else if (type == "number") {
                valueInput.value = property.defaultValue.toString();
                changeFun = e => {
                    const newValue = parseFloat(e.target.value);
                    if (!isNaN(newValue)) {
                        changed[property.name] = newValue;
                    }
                };
            } else if (type == "string|number") {
                valueInput.value = property.defaultValue.toString();
                changeFun = e => {
                    const newValue = parseFloat(e.target.value);
                    if (!isNaN(newValue)) {
                        changed[property.name] = newValue;
                    } else {
                        changed[property.name] = e.target.value;
                    }
                };
            } else if (type == "radian") {
                valueInput.value = property.defaultValue.toString();
                changeFun = e => {
                    const newValue = parseFloat(e.target.value);
                    if (!isNaN(newValue)) {
                        changed[property.name] = newValue * Math.PI / 180;
                    }
                };
            } else if (type == "boolean") {
                valueInput.type = "checkbox";
                valueInput.checked = property.defaultValue;
                changeFun = e => {
                    changed[property.name] = e.target.checked;
                };
            } else {
                valueInput.value = property.defaultValue.join(",");
                changeFun = e => {
                    if (e.target.value != "") {
                        const stringList = e.target.value.split(",");
                        if (stringList.length >= property.minLength) {
                            changed[property.name] = [];
                            for (const str of stringList) {
                                changed[property.name].push(str);
                            }
                        }
                    }
                };
            }
            valueInput.addEventListener("change", changeFun);

            propElemMap.set(namePrefix + property.name, {
                type: property.type,
                element: valueInput
            });

            parentDiv.appendChild(nameTextNode);
            parentDiv.appendChild(valueInput);
            parentDiv.appendChild(br);
        } else if (type == "enum") {
            const nameTextNode = document.createTextNode(`${property.name}: `);
            const valueSelect = document.createElement("select");
            const br = document.createElement("br");

            for (const option of property.options) {
                const optionElem = document.createElement("option");
                optionElem.innerHTML = option;
                valueSelect.appendChild(optionElem);
            }
            valueSelect.addEventListener("change", e => {
                changed[property.name] = e.target.value;
            });

            propElemMap.set(namePrefix + property.name, {
                type: property.type,
                element: valueSelect
            });

            parentDiv.appendChild(nameTextNode);
            parentDiv.appendChild(valueSelect);
            parentDiv.appendChild(br);
        } else if (type == "object") {
            const nameDiv = document.createElement("div");
            nameDiv.className = "objectProperty";
            nameDiv.innerHTML = `${property.name}:`;

            const propertiesDiv = document.createElement("div");
            propertiesDiv.className = "propertyList";

            nameDiv.addEventListener("click", e => {
                if (propertiesDiv.style.display == "none") {
                    e.target.innerHTML = `${property.name}:`;
                    propertiesDiv.style.display = "block";
                } else {
                    e.target.innerHTML = `${property.name}(hidden)`;
                    propertiesDiv.style.display = "none";
                }
            });

            // 递归创建属性树
            createPropUITree(propertiesDiv, property.children, changed[property.name], `${property.name}.`);

            parentDiv.appendChild(nameDiv);
            parentDiv.appendChild(propertiesDiv);
        }
    }
}

function setProperty(obj, propName, val) {
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

    const typeElem = propElemMap.get(propName);
    const type = typeElem.type;
    const element = typeElem.element;
    if (type == "number") {
        element.value = val.toString();
    } else if (type == "string") {
        element.value = val;
    }
}