// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
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
	var mvp = MatrixMult(projectionMatrix, trans);
	return mvp;
}


// [TO-DO] Complete the implementation of the following class.

var boxVSObj = `
	attribute vec3 pos;
	attribute vec2 txc;
	uniform mat4 mvp;
	uniform bool showTexture;
	uniform bool hasTexture;
	varying vec2 texCoord;

	void main()
	{
		gl_Position = mvp * vec4(pos,1);
		texCoord = txc;
	}
`;
// Fragment shader source code
var boxFSObj = `
	precision mediump float;
	uniform sampler2D tex;
	varying vec2 texCoord;

	uniform bool showTexture;
	uniform bool hasTexture;

	void main()
	{
		if (showTexture && hasTexture)
		{
			gl_FragColor = texture2D(tex, texCoord);
		}
		else
		{
			gl_FragColor = vec4(1,gl_FragCoord.z*gl_FragCoord.z,0,1);
		}
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

		// Get the ids of the vertex attributes in the shaders
		this.vertPos = gl.getAttribLocation(this.prog, 'pos');

		this.sampler = gl.getUniformLocation(this.prog, 'tex');

		this.texCoordLocation = gl.getAttribLocation(this.prog, 'txc');
		this.showTextureLocation = gl.getUniformLocation(this.prog, 'showTexture');
		this.hasTextureLocation = gl.getUniformLocation(this.prog, 'hasTexture');

		this.mytex = gl.createTexture();
		this.posBuffer = gl.createBuffer();
		this.texBuffer = gl.createBuffer();

		this.numTriangles = 0;

		this.isSwapped = false;

		this.showTextur = true;
		this.hasTexture = false;
		this.hasObj = false;
		this.vertPosHist = null;
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.
		this.numTriangles = vertPos.length / 3;

		this.vertPosHist = vertPos;
		this.hasObj = true;

		var pos = [];

		if (this.isSwapped)
		{
			for (var i = 0; i < this.numTriangles; i++) {
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

		/* OLD
		var texCoordArray = [];
		for (var i = 0; i < texCoords.length; i++)
		{
			texCoordArray.push(vertPos[i]);
		}

		gl.bindTexture(gl.TEXTURE_2D, this.mytex);
		this.texBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoordArray), gl.STATIC_DRAW);
		gl.activeTexture(gl.TEXTURE0);*/
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

			if (swap) {
				for (var i = 0; i < this.numTriangles; i++) {
					pos.push(this.vertPosHist[3 * i]);
					pos.push(this.vertPosHist[(3 * i) + 2]);
					pos.push(this.vertPosHist[(3 * i) + 1]);
				}
			}
			else {
				for (var i = 0; i < this.vertPosHist.length; i++) {
					pos.push(this.vertPosHist[i]);
				}
			}

			gl.useProgram(this.prog);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
        }
	}
	
	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw( trans )
	{
		// [TO-DO] Complete the WebGL initializations before drawing

		gl.useProgram(this.prog);
		gl.uniformMatrix4fv(this.mvp, false, trans);

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


		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);


		/* OLD
		gl.useProgram(this.prog);
		gl.uniformMatrix4fv(this.mvp, false, trans);

		var v = 0;
		if (this.hasTexture)
			v = 1;
		gl.uniform1i(this.hasTextureLocation, v);
		v = 0;
		if (this.showTextur)
			v = 1;
		gl.uniform1i(this.showTextureLocation, v);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.mytex);
		gl.uniform1i(this.sampler, 0);
		// Draws vertex
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.enableVertexAttribArray(this.vertPos);
		gl.vertexAttribPointer(this.vertPos, 3, gl.FLOAT, false, 0, 0);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
		gl.enableVertexAttribArray(this.texCoordLocation);
		gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0);

		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);*/
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



		/* OLD
		this.hasTexture = true;

		// [TO-DO] Bind the texture
		gl.useProgram(this.prog);

		gl.bindTexture(gl.TEXTURE_2D, this.mytex);

		// You can set the texture image data using the following command.
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
		gl.generateMipmap(gl.TEXTURE_2D);

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		//gl.uniform1i(this.sampler, 0);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_LINEAR);*/
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		this.showTextur = show;
	}
	
}
