var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diffuse coefficient
	vec3  k_s;	// specular coefficient
	float n;	// specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

bool IntersectRay( inout HitInfo hit, Ray ray );

// Shades the given point and returns the computed color.
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
	vec3 color = vec3(0,0,0);
	for ( int i=0; i<NUM_LIGHTS; ++i ) {
		// TO-DO: Check for shadows
		// TO-DO: If not shadowed, perform shading using the Blinn model
		// color += mtl.k_d * lights[i].intensity;	// change this line

		// Preston's code
		
		HitInfo hit;
		Ray shadRay;
		shadRay.pos = position;
		shadRay.dir = normalize(lights[i].position - position);

		if (IntersectRay(hit, shadRay))
		{
			//color += mtl.k_d * lights[i].intensity;
			//color += 0.25 * mtl.k_d * lights[i].intensity;

			//color += cosThetaColor + cosPhiColor * lights[i].intensity;
			//color += lights[i].intensity * cosTheta * (mtl.k_d + mtl.k_s * (cosPhiAlpha / cosTheta));
		}
		else
		{
			vec3 lightDir = normalize(lights[i].position - position);
			vec3 h = normalize(view + lightDir);
			float cosPhi = max(dot(h, normal), 0.0);
			float cosPhiAlpha = pow(cosPhi, mtl.n                                       );
			float cosTheta = max(dot(normal, lightDir), 0.0);
			vec3 cosThetaColor = cosTheta * mtl.k_d;
			vec3 cosPhiColor = cosPhiAlpha * mtl.k_s;
			color += cosThetaColor + cosPhiColor * lights[i].intensity;
			//color += lights[i].intensity * cosTheta * (mtl.k_d + mtl.k_s * (cosPhiAlpha / cosTheta));
		}

	}
	return color;
}

// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
	hit.t = 1e30;
	bool foundHit = false;
	for ( int i=0; i<NUM_SPHERES; ++i ) {
		// TO-DO: Test for ray-sphere intersection
		// TO-DO: If intersection is found, update the given HitInfo

		// Preston's code

		float a = dot(ray.dir, ray.dir);
		float b = dot((2.0 * ray.dir), (ray.pos - spheres[i].center));
		float c = dot((ray.pos - spheres[i].center), (ray.pos - spheres[i].center)) - pow(spheres[i].radius, 2.0);
		float delta = pow(b, 2.0) - (4.0 * a * c);
		if (delta >= 0.0) // Possible hit
		{
			float t = ((0.0 - b) - sqrt(delta)) / (a + a);
			if (t < hit.t && t > 1e-4) // Hit
			{
				foundHit = true;
				hit.t = t;
				hit.position = ray.pos + t * ray.dir;
				hit.normal = normalize(hit.position - spheres[i].center);
				hit.mtl = spheres[i].mtl;
			}
		}

	}
	return foundHit;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer( Ray ray )
{
	HitInfo hit;
	if ( IntersectRay( hit, ray ) ) {
		vec3 view = normalize( -ray.dir );
		vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
		
		// Compute reflections
		vec3 k_s = hit.mtl.k_s;
		for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
			if ( bounce >= bounceLimit ) break;
			if ( hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0 ) break;
			
			Ray r;	// this is the reflection ray
			HitInfo h;	// reflection hit info
			
			// TO-DO: Initialize the reflection ray
			
			// Preston's Code
			r.pos = hit.position;
			r.dir = normalize(2.0 * dot(-ray.dir, hit.normal) * hit.normal + ray.dir);
			
			if ( IntersectRay( h, r ) ) {
				// TO-DO: Hit found, so shade the hit point
				// TO-DO: Update the loop variables for tracing the next reflection ray

				// Preston's code
				//clr += k_s * h.mtl.k_d;
				//clr += k_s * Shade(h.mtl, h.position, h.normal, -r.dir);
				//clr += Shade(h.mtl, h.position, h.normal, -r.dir);
				clr += Shade(h.mtl, h.position, h.normal, -r.dir) * k_s;
				k_s *= h.mtl.k_s;

				hit = h;
				ray = r;

			} else {
				// The refleciton ray did not intersect with anything,
				// so we are using the environment color
				clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
				break;	// no more reflections
			}
		}
		return vec4( clr, 1 );	// return the accumulated color, including the reflections
	} else {
		return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );	// return the environment color
	}
}
`;