So "what the hell" is functional specification, and what is technical specification?

Well the exact definition is as grey as human morality, some people find it clear cut, others find it blur as F!. So here is the rough guideline.

| | |
|---------------:|:-----------------------------------------------------------------------------------------------------------------------|
| **Functional** | **What the person paying / selling / approving wants to see** <br/>Which is generally more from the user point of view |
| **Technical**  | **What your programmers actually needs to know** <br/>Which is generally more on a component feature by feature view.  |

Sometimes many components may overlap, which is why I actually recommend creating both document concurrently (with this tool!). However the specifics is tricky. For example while most customers do not care for encoding format, weather its UTF-8 or UTF-16, which generally makes its way to the technical specifications. Things such as MeSQL is subjective to customers. Some customers, especially those who wish to integrate or use their existing infrastructure, will view it as something that should be in a functional specification. Some customers may not even care if the application is Java or PHP, as long as they get their pretty pages. So use your judgement here.

So perhaps a better way to evaluate this, if you have a perfectly good (to the developer) sales person is the following...

~~~
function isThisTechnicalOrFunctional(X) {
	if( Salesperson Salesy needs to know X to do her job well ) {
		return "functional";
	} else if( Developer Desi needs to know X to do her job well ) {
		return "technical";
	} else if( is X a feature ){
		return "wishlist";
	} else if( does anyone remotely care about X ){
		return "notes";
	} else {
		return "trash-bin"
	}
}
~~~
