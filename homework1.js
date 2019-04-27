"use strict";

var canvas;
var gl;
var numVertices = 36;
var texSize = 512;

var program;

var texture1;
var texture2;


var togl_light_flag = true;

var pointsArray = [];
var colorsArray = [];
var normalsArray = [];
var texCoordsArray = [];

var image1 = new Array()
for (var i = 0; i < texSize; i++) image1[i] = new Array();
for (var i = 0; i < texSize; i++)
    for (var j = 0; j < texSize; j++)
        image1[i][j] = new Float32Array(4);
for (var i = 0; i < texSize; i++) for (var j = 0; j < texSize; j++) {
    var c = (((i & 0x8) == 0) ^ ((j & 0x8) == 0));
    image1[i][j] = [c, c, c, 1];
}

// Convert floats to ubytes for texture
var image2 = new Uint8Array(4*texSize*texSize);

for ( var i = 0; i < texSize; i++ )
    for ( var j = 0; j < texSize; j++ )
        for(var k =0; k<4; k++)
            image2[4*texSize*i+4*j+k] = 255*image1[i][j][k];

var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
];

var vertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0),  // white
    vec4(0.0, 1.0, 1.0, 1.0)   // cyan
];

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

var lightPosition = vec4(0.2, 0.2, 2.0, 1);
var lightAmbient = vec4(0.3, 0.3, 0.3, 1);
var lightDiffuse = vec4(0.7, 0.7, 0.7, 1);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1);

var materialAmbient = vec4(0.25, 0.25, 0.25, 1.0);
var materialDiffuse = vec4(0.4, 0.4, 0.4, 1.0);
var materialSpecular = vec4(0.774597, 0.774597, 0.774597, 1.0);
var materialShininess = 55;


var transl_X = 0;
var transl_Y = 0;
var transl_Z = 0;
var scaling_value = 0.8;

var near = 1;
var far = 2000;
var FieldOfViewY = 45.0;// Field-of-view in Y direction angle (in degrees)
var aspect; // Viewport aspect ratio
var radius = 3.0;
var theta = 0.0;
var phi = 0.0;

var eye = vec3(radius*Math.sin(phi), radius*Math.sin(theta), radius*Math.cos(phi));
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var scaleMatrix, scaleMatrixLoc;
var translationMatrix, translationMatrixLoc;

function configureTexture(image) {
    texture1 = gl.createTexture();
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

    texture2 = gl.createTexture();
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
}


function quad(a, b, c, d) {
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = vec3(cross(t1, t2));

    pointsArray.push(vertices[a]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[0]);

    pointsArray.push(vertices[b]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[1]);

    pointsArray.push(vertices[c]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[2]);

    pointsArray.push(vertices[a]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[0]);

    pointsArray.push(vertices[c]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[2]);

    pointsArray.push(vertices[d]);
    normalsArray.push(normal);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[3]);
}

function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}


window.onload = function init() {

    canvas = document.getElementById("gl-canvas");
    aspect = canvas.width / canvas.height;

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    colorCube();

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    configureTexture(image2);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.uniform1i(gl.getUniformLocation(program, "Tex0"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.uniform1i(gl.getUniformLocation(program, "Tex1"), 1);

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    scaleMatrixLoc = gl.getUniformLocation(program, "scaleMatrix");
    translationMatrixLoc = gl.getUniformLocation(program, 'translationMatrix');

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
        flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
        flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),
        flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),
        flatten(lightPosition));

    gl.uniform1f(gl.getUniformLocation(program,
        "shininess"), materialShininess);

    gl.uniform4fv(gl.getUniformLocation(program, "goru_ambient_product"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "goru_diffuse_product"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "goru_specular_product"), flatten(specularProduct));

    gl.uniform1f(gl.getUniformLocation(program, "goru_shininess"), materialShininess);
    gl.uniform3fv(gl.getUniformLocation(program,"eye"),flatten(eye));
    document.getElementById("R").oninput = function () {
        radius = this.valueAsNumber;
    };

    document.getElementById("Theta").oninput = function () {
        theta = this.valueAsNumber;
        gl.uniform3fv(gl.getUniformLocation(program,"eye"),flatten(eye))
    };
    document.getElementById("Phi").oninput = function () {
        phi = this.valueAsNumber;
        gl.uniform3fv(gl.getUniformLocation(program,"eye"),flatten(eye))
    };
    document.getElementById("Button_Light").onclick = function () {
        togl_light_flag = !togl_light_flag;
    };
    document.getElementById("scaler").oninput = function (event) {
        scaling_value = this.valueAsNumber;
    };
    document.getElementById("Transl_X_slider").oninput = function (event) {
        transl_X = this.valueAsNumber;
    };

    document.getElementById("Transl_Y_slider").oninput = function (event) {
        transl_Y = this.valueAsNumber;
    };

    document.getElementById("Transl_Z_slider").oninput = function (event) {
        transl_Z = -this.valueAsNumber;
    };

    document.getElementById("near").oninput = function (event) {
        if(this.valueAsNumber !== far){
            near = this.valueAsNumber;
        }
    };
    document.getElementById("far").oninput = function (event) {
        if(this.valueAsNumber !== near){
            far = this.valueAsNumber;
        }
    };

    render();
};

let render = function () {
    function renderScene(drawX, drawY, drawWidth, drawHeight, projectionMatrix) {
        gl.enable(gl.SCISSOR_TEST);
        gl.viewport(drawX, drawY, drawWidth, drawHeight);
        gl.scissor(drawX, drawY, drawWidth, drawHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        eye = vec3(radius*Math.sin(phi), radius*Math.sin(theta), radius*Math.cos(phi));
        modelViewMatrix = lookAt(eye, at, up);
        translationMatrix = translate(transl_X, transl_Y, transl_Z);
        scaleMatrix = scalem(scaling_value, scaling_value, scaling_value);

        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
        gl.uniformMatrix4fv(scaleMatrixLoc, false, flatten(scaleMatrix));
        gl.uniformMatrix4fv(translationMatrixLoc, false, flatten(translationMatrix));
        gl.uniform1i(gl.getUniformLocation(program, "togl_light_flag"), togl_light_flag);
        gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    }

    const width = gl.canvas.width;
    const height = gl.canvas.height;
    const displayWidth = gl.canvas.clientWidth;
    const displayHeight = gl.canvas.clientHeight;

    {
        const dispWidth = displayWidth / 2;
        const dispHeight = displayHeight;
        const aspect = dispWidth / dispHeight;
        projectionMatrix = perspective(FieldOfViewY, aspect, near, far);
        gl.clearColor(0.102, 0.102, 0.102, 0.6);
        renderScene(0, 0, width / 2, height, projectionMatrix);
    }

    {
        const dispWidth = displayWidth / 2;
        const dispHeight = displayHeight;
        const aspect = dispWidth / dispHeight;
        const top = 1;
        const bottom = -top;
        const right = top * aspect;
        const left = -right;
        projectionMatrix = ortho(left, right, bottom, top, near, far);
        gl.clearColor(0.102, 0.102, 0.102, 0.6);
        renderScene(width / 2, 0, width / 2, height, projectionMatrix);
    }

    requestAnimFrame(render);
};