// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{
	var ar = Array(1, 0, 0, 0, 1, 0, 0, 0, 1);

	var rotationR = rotation * (Math.PI / 180.0);
	
	// Scale
	ar[0] = ar[0] * scale;
	ar[4] = ar[4] * scale;

	// Rotation
	var arRot = Array(Math.cos(rotationR), Math.sin(rotationR), 0, -Math.sin(rotationR), Math.cos(rotationR), 0, 0, 0, 1);
	ar = ApplyTransform(arRot, ar);
	
	// Transform
	ar[6] = positionX;
	ar[7] = positionY;

	return ar;
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform( trans1, trans2 )
{
	var ar = Array(1, 0, 0, 0, 1, 0, 0, 0, 1);
	
	// Transformation 1
	ar[0] = trans2[0] * trans1[0] + trans2[3] * trans1[1] + trans2[6] * trans1[2];
	ar[1] = trans2[1] * trans1[0] + trans2[4] * trans1[1] + trans2[7] * trans1[2];
	ar[2] = trans2[2] * trans1[0] + trans2[5] * trans1[1] + trans2[8] * trans1[2];
	ar[3] = trans2[0] * trans1[3] + trans2[3] * trans1[4] + trans2[6] * trans1[5];
	ar[4] = trans2[1] * trans1[3] + trans2[4] * trans1[4] + trans2[7] * trans1[5];
	ar[5] = trans2[2] * trans1[3] + trans2[5] * trans1[4] + trans2[8] * trans1[5];
	ar[6] = trans2[0] * trans1[6] + trans2[3] * trans1[7] + trans2[6] * trans1[8];
	ar[7] = trans2[1] * trans1[6] + trans2[4] * trans1[7] + trans2[7] * trans1[8];
	ar[8] = trans2[2] * trans1[6] + trans2[5] * trans1[7] + trans2[8] * trans1[8];
	
	return ar;
}
