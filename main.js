let app = new PIXI.Application({ width: 800, height: 600 });
document.body.appendChild(app.view);

const fuck = new PIXI.Text("Hello.");
fuck.x = 400;
fuck.y = 300;
fuck.anchor.set(0.5, 0.5);
fuck.style.fill = ["#ffffff"];
app.stage.addChild(fuck);

const fuckProperties = [
    {
        name: "text",
        type: "string",
        defaultValue: "北京理工大学"
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
                type: "string",
                defaultValue: "26px"
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
const inspector = document.getElementById("inspector");
createProperties(inspector, fuckProperties, fuck);

function createProperties(parentDiv, properties, changed) {
    for (const property of properties) {
        const type = property.type;

        if (type == "string" || type == "number" || type == "radian" || type == "boolean" || type == "array") {
            const nameTextNode = document.createTextNode(`${property.name}: `);
            const valueInput = document.createElement("input");
            const br = document.createElement("br");
            let changeFun;

            if (type == "string") {
                valueInput.type = "text";
                valueInput.value = property.defaultValue;
                changeFun = e => {
                    changed[property.name] = e.target.value;
                };
            } else if (type == "number") {
                valueInput.type = "text";
                valueInput.value = property.defaultValue.toString();
                changeFun = e => {
                    const newValue = parseFloat(e.target.value);
                    if (!isNaN(newValue)) {
                        changed[property.name] = newValue;
                    }
                };
            } else if (type == "radian") {
                valueInput.type = "text";
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
                    const stringList = e.target.value.split(",");
                    if (e.target.value != "" && stringList.length >= property.minLength) {
                        changed[property.name] = [];
                        for (const str of stringList) {
                            changed[property.name].push(str);
                        }
                    }
                };
            }
            valueInput.addEventListener("change", changeFun);
    
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
            createProperties(propertiesDiv, property.children, changed[property.name]);

            parentDiv.appendChild(nameDiv);
            parentDiv.appendChild(propertiesDiv);
        }
    }
}