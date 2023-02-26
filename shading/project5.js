// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	// X rotation
	var rotx = [
		1, 0, 0, 0,
		0, Math.cos(rotationX), Math.sin(rotationX), 0,
		0, -Math.sin(rotationX), Math.cos(rotationX), 0,
		0, 0, 0, 1
	];

	// Y rotation
	var roty = [
		Math.cos(rotationY), 0, -Math.sin(rotationY), 0,
		0, 1, 0, 0,
		Math.sin(rotationY), 0, Math.cos(rotationY), 0,
		0, 0, 0, 1
	];

	// Final rotation
	var rot = MatrixMult(rotx, roty);

	// Final transformation matrix
	trans = MatrixMult(trans, rot);
	return trans;
}


// [TO-DO] Complete the implementation of the following class.

var boxVSObj = `
	attribute vec3 pos;
	attribute vec2 txc;
	attribute vec3 normalCoords;

	uniform vec3 lightDir;
	uniform mat4 mvp;
	uniform mat4 mv;
	uniform mat3 normMat;
	uniform float shine;

	uniform bool showTexture;
	uniform bool hasTexture;
	varying vec2 texCoord;
	varying vec3 normalCoord;
	varying vec3 viewPos;

	void main()
	{
		gl_Position = mvp * vec4(pos,1);
		texCoord = txc;
		normalCoord = vec3(normMat * normalCoords);

		vec4 pos4 = mv * vec4(pos, 1.0);
		viewPos = vec3(pos4) / pos4.w;
	}
`;
// Fragment shader source code
var boxFSObj = `
	precision mediump float;
	uniform sampler2D tex;
	varying vec2 texCoord;
	varying vec3 normalCoord;
	varying vec3 viewPos;

	uniform bool showTexture;
	uniform bool hasTexture;

	uniform vec3 lightDir;
	uniform mat4 mv;
	uniform mat3 normMat;
	uniform float shine;

	void main()
	{
		vec3 I = vec3(1,1,1);
		vec3 colorD = vec3(1,1,1);
		vec3 colorS = vec3(1,1,1);
		vec3 viewDir = normalize(-viewPos);
		vec3 lightDirN = normalize(-lightDir);

		vec3 h = normalize(viewDir + lightDir);
		vec3 n = normalize(normalCoord);
		float cosPhi = max(dot(h, n), 0.0);
		float cosPhiAlpha = pow(cosPhi, shine);
		float cosTheta = max(dot(n, lightDir), 0.0);

		if (showTexture && hasTexture)
		{
			colorD = texture2D(tex, texCoord).rgb;
		}

		vec3 cosThetaColor = cosTheta * colorD;
		vec3 cosPhiColor = cosPhiAlpha * colorS;
		vec3 color = cosThetaColor + cosPhiColor;
		gl_FragColor = vec4(color, 1.0);
	}
`;

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations

		// Compile the shader program
		this.prog = InitShaderProgram(boxVSObj, boxFSObj);

		// Get the ids of the uniform variables in the shaders
		this.mvp = gl.getUniformLocation(this.prog, 'mvp');
		this.mv = gl.getUniformLocation(this.prog, 'mv');
		this.normMat = gl.getUniformLocation(this.prog, 'normMat');

		// Get the ids of the vertex attributes in the shaders
		this.vertPos = gl.getAttribLocation(this.prog, 'pos');

		this.sampler = gl.getUniformLocation(this.prog, 'tex');

		this.texCoordLocation = gl.getAttribLocation(this.prog, 'txc');
		this.showTextureLocation = gl.getUniformLocation(this.prog, 'showTexture');
		this.hasTextureLocation = gl.getUniformLocation(this.prog, 'hasTexture');

		this.normalCoords = gl.getAttribLocation(this.prog, 'normalCoords');
		this.lightDir = gl.getUniformLocation(this.prog, 'lightDir');
		this.shine = gl.getUniformLocation(this.prog, 'shine');

		this.mytex = gl.createTexture();
		this.posBuffer = gl.createBuffer();
		this.texBuffer = gl.createBuffer();
		this.normalBuffer = gl.createBuffer();

		this.numTriangles = 0;

		this.isSwapped = false;

		this.showTextur = true;
		this.hasTexture = false;
		this.hasObj = false;
		this.vertPosHist = null;
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		this.numTriangles = vertPos.length / 3;

		this.vertPosHist = vertPos;
		this.hasObj = true;

		var pos = [];

		if (this.isSwapped)
		{
			for (var i = 0; i < this.numTriangles; i++)
			{
				pos.push(vertPos[3 * i]);
				pos.push(vertPos[(3 * i) + 2]);
				pos.push(vertPos[(3 * i) + 1]);
			}
		}
		else
		{
			for (var i = 0; i < vertPos.length; i++)
			{
				pos.push(vertPos[i]);
			}
		}

		gl.useProgram(this.prog);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);

		// Texture
		var texPos = [];

		for (var i = 0; i < texCoords.length; i++)
		{
			texPos.push(texCoords[i]);
		}

		gl.useProgram(this.prog);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texPos), gl.STATIC_DRAW);
		
		// Normals
		var normPos = [];

		for (var i = 0; i < normals.length; i++)
		{
			normPos.push(normals[i]);
		}

		gl.useProgram(this.prog);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normPos), gl.STATIC_DRAW);
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		this.isSwapped = swap;
		if (!this.hasObj)
			return;

		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		if (this.hasObj)
		{
			var pos = [];

			if (swap)
			{
				for (var i = 0; i < this.numTriangles; i++)
				{
					pos.push(this.vertPosHist[3 * i]);
					pos.push(this.vertPosHist[(3 * i) + 2]);
					pos.push(this.vertPosHist[(3 * i) + 1]);
				}
			}
			else
			{
				for (var i = 0; i < this.vertPosHist.length; i++)
				{
					pos.push(this.vertPosHist[i]);
				}
			}

			gl.useProgram(this.prog);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
		}
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		gl.useProgram(this.prog);
		gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
		gl.uniformMatrix4fv(this.mv, false, matrixMV);
		gl.uniformMatrix3fv(this.normMat, false, matrixNormal);

		var v = 0;
		if (this.hasTexture)
			v = 1;
		gl.uniform1i(this.hasTextureLocation, v);
		v = 0;
		if (this.showTextur)
			v = 1;
		gl.uniform1i(this.showTextureLocation, v);

		// Draws vertex
		gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
		gl.enableVertexAttribArray(this.vertPos);
		gl.vertexAttribPointer(this.vertPos, 3, gl.FLOAT, false, 0, 0);

		// Draw Texture
		gl.enableVertexAttribArray(this.texCoordLocation);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
		gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.mytex);
		gl.uniform1i(this.sampler, 0);

		// Draw shader
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.enableVertexAttribArray(this.normalCoords);
		gl.vertexAttribPointer(this.normalCoords, 3, gl.FLOAT, false, 0, 0);


		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		this.hasTexture = true;
		gl.useProgram(this.prog);

		gl.bindTexture(gl.TEXTURE_2D, this.mytex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.mytex);
		gl.uniform1i(this.smapler, 0);
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		this.showTextur = show;
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the light direction.
		gl.useProgram(this.prog);
		gl.uniform3f(this.lightDir, x, y, z);
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram(this.prog);
		gl.uniform1f(this.shine, shininess);
	}
}
