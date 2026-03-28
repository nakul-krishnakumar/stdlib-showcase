
> **TL;DR:**<br>
Getting KMeans implemented is going to be the hardest part of this proposal so I plan on dedicating the entire first half of the timeline for it.<br>
After the mid-term evaluation submission, the next big hurdle would be to get `sgd-classification` implemented. Rest two (`sgd-regresssion` and `perceptron`) will be wrappers over packages implemented for `sgd-classification`.

---

#### Community Bonding Period:
During the three-week community bonding period, I will focus on discussing and finalizing naming and other conventions, while also beginning initial work on the project. My work will revolve around:
- Distance Metrics **[ Difficulty : 2/5 ]**
  - Getting [#10677](https://github.com/stdlib-js/stdlib/pull/10677) merged which will unblock `@stdlib/stats/strided/dpcorr`, letting me implement `@stdlib/stats/strided/distances/dcorrelation`.
  
  - Packages:
    - `stats/strided/dpcorr`
    - `stats/strided/distances/dcorrelation`

- Implement Loss functions **[ Difficulty : 2/5 ]**
    - Getting these implemented will be pretty straight forward and can be worked on parallely.
  
    - For each loss function, everything other than the implementation, including tests, benchmarks, and documentation, would largely remain the same.
  
    - Packages:
      - `ml/loss/dhinge`
      - `ml/loss/dlog`
      - `ml/loss/dmodified-huber`
      - `ml/loss/dsquared-hinge` 
      - `ml/loss/dperceptron`
      - `ml/loss/dsquared-error`
      - `ml/loss/dhuber`
      - `ml/loss/depsilon-insensitive`
      - `ml/loss/dsquared-epsilon-insensitive`
  
    - Example implementation:
		```javascript
		// ml/loss/dhinge/lib/dhinge.js
		var max = require( '@stdlib/math/base/special/max' );

		function dhinge( y, p ) {
			return max( 0, 1 - ( y*p ) );
		}
		```

		```javascript
		// ml/loss/dhinge/lib/dhinge.native.js
		var addon = require( './../src/addon.node' );

		function dhinge( y, p ) {
			return addon( y, p );
		}
		```

		```javascript
		// ml/loss/dhinge/lib/main.js
		var setReadOnly = require( '@stdlib/utils/define-nonenumerable-read-only-property' );
		var dhinge = require( './dhinge.js' );
		var ndarray = require( './ndarray.js' );

		setReadOnly( dhinge, 'gradient', gradient );
		```

		```javascript
		// ml/loss/dhinge/lib/gradient.js
		function gradient( y, p ) {
			if ( y*p < 1 ) {
				return -y;
			}
			return 0;
		}
		```

		```javascript
		// ml/loss/dhinge/lib/gradient.native.js
		var addon = require( './../src/addon.node' );

		function gradient( y, p ) {
			return addon.gradient( y, p );
		}
		```
---

Assuming a 12 week schedule,

####  Week 1 (May 25 - May 31) :
- During the first week, my work will focus on polishing the existing PR for `ml/strided/dkmeansld`, including adding benchmarks, documentation, tests, examples, and C implementation. I will also refine existing PRs for introducing the `ml/base/kmeans/metrics` and `ml/base/kmeans/algorithms` enums.
- Packages to implement:

  - `ml/strided/dkmeansld` **[ Difficulty : 4/5 ]** [PR](https://github.com/stdlib-js/stdlib/pull/9703)
  - **Metrics enum** **[ Difficulty : 1/5 ]**
     - `ml/base/kmeans/metrics` [PR](https://github.com/stdlib-js/stdlib/pull/10714)
     - `ml/base/kmeans/metric-str2enum` [PR](https://github.com/stdlib-js/stdlib/pull/10842)
     - `ml/base/kmeans/metric-enum2str` [PR](https://github.com/stdlib-js/stdlib/pull/10841)
     - `ml/base/kmeans/metric-resolve-enum`
     - `ml/base/kmeans/metric-resolve-str`
   <br>

  - **Algorithms enum** **[ Difficulty : 1/5 ]**
     - `ml/base/kmeans/algorithms` [PR](https://github.com/stdlib-js/stdlib/pull/10796)
     - `ml/base/kmeans/algorithm-str2enum`
     - `ml/base/kmeans/algorithm-enum2str`
     - `ml/base/kmeans/algorithm-resolve-enum`
     - `ml/base/kmeans/algorithm-resolve-str`

---

#### Week 2 (June 1 - June 7):
- I will work on implementing the cluster initialization algorithms.
  - `ml/strided/dkmeans-init-plus-plus` **[ Difficulty : 3/5 ]**
  - `ml/strided/dkmeans-init-forgy` **[ Difficulty : 2/5 ]**
- If time persists, I will parallely start implementing `ml/base/kmeans/results`

---

#### Week 3 (June 8 - June 14):
- `ml/strided/dkmeans-init-sample` **[ Difficulty : 2/5 ]**
- `ml/base/kmeans/results` **[ Difficulty : 2/5 ]**
  - Add `ml/base/kmeans/results/factory`
  - Add `ml/base/kmeans/results/float32`
  - Add `ml/base/kmeans/results/float64`
  - Add `ml/base/kmeans/results/struct-factory`
  - Add `ml/base/kmeans/results/to-json`
  - Add `ml/base/kmeans/results/to-string`
- If time persists or PRs waiting for review, I will start with Week 4 schedule.
---

#### Week 4 (June 15 - June 21):
- `ml/base/kmeans/ctor` **[ Difficulty : 4/5 ]**

- By the end of this week I expect to have all the packages  implemented necessary for the proper working of `kmeans`.

---

#### Week 5 (June 22 - June 28):
I will start working on implementing **SGD Classification**.
- Packages:
  - `ml/strided/dsgd-trainer` (This is the low level trainer that both sgd-classification as well as sgd-regression will use) **[ Difficulty : 3/5 ]**
  - **Loss enum** **[ Difficulty : 1/5 ]**
    - `ml/base/sgd-classification/losses`
    - `ml/base/sgd-classification/loss-str2enum`
    - `ml/base/sgd-classification/loss-enum2str`
    - `ml/base/sgd-classification/loss-resolve-enum`
    - `ml/base/sgd-classification/loss-resolve-str`
  - **LearningRate enum** **[ Difficulty : 1/5 ]**
    - `ml/base/sgd-classification/learning-rates`
    - `ml/base/sgd-classification/learning-rate-str2enum`
    - `ml/base/sgd-classification/learning-rate-enum2str`
    - `ml/base/sgd-classification/learning-rate-resolve-enum`
    - `ml/base/sgd-classification/learning-rate-resolve-str`
---

#### Week 6 (June 29 - July 5): (midterm)
- This would be a buffer week where I would focus on completing any remaining part of `kmeans` algorithm as well as `sgd-trainer`, so that I can document and submit for mid-term evaluation.
- Parallely I will work on `ml/base/sgd-classification/results` **[ Difficulty : 2/5 ]**
  - Add `ml/base/sgd-classification/results/factory`
  - Add `ml/base/sgd-classification/results/float32`
  - Add `ml/base/sgd-classification/results/float64`
  - Add `ml/base/sgd-classification/results/struct-factory`
  - Add `ml/base/sgd-classification/results/to-json`
  - Add `ml/base/sgd-classification/results/to-string`

---

#### Week 7:
- This week, I will work on implementing the `dsgd-classification-binary` and `dsgd-classification-multiclass`, both of which would be thin wrapper over `ml/strided/dsgd-trainer`
- Packages:
  - `ml/strided/dsgd-classification-binary` **[ Difficulty : 2/5 ]**
  - `ml/strided/dsgd-classification-multiclass` **[ Difficulty : 2/5 ]**

- If time persists, I will also start working on `ml/sgd-classification/ctor`.

---

#### Week 8:
- I will finish the work on `ml/sgd-classification/ctor` **[ Difficulty : 4/5 ]**
- By the end of this week I expect to have all the packages  implemented necessary for the proper working of `sgd-classification`.

---

#### Week 9:
- `ml/perceptron/ctor` **[ Difficulty : 4/5 ]**
- By the end of this week I expect to have all the packages  implemented necessary for the proper working of `perceptron` and then I will start working on enums required for `sgd-regression`.
- **Loss enum** **[ Difficulty : 1/5 ]**
  - `ml/base/sgd-regression/losses`
  - `ml/base/sgd-regression/loss-str2enum`
  - `ml/base/sgd-regression/loss-enum2str`
  - `ml/base/sgd-regression/loss-resolve-enum`
  - `ml/base/sgd-regression/loss-resolve-str`
- **LearningRate enum** **[ Difficulty : 1/5 ]**
  - `ml/base/sgd-regression/learning-rates`
  - `ml/base/sgd-regression/learning-rate-str2enum`
  - `ml/base/sgd-regression/learning-rate-enum2str`
  - `ml/base/sgd-regression/learning-rate-resolve-enum`
  - `ml/base/sgd-regression/learning-rate-resolve-str`

---

#### Week 10:
- `ml/strided/dsgd-regression` **[ Difficulty: 2/5 ]**
- `ml/base/sgd-regression/results` **[ Difficulty : 2/5 ]**
  - Add `ml/base/sgd-regression/results/factory`
  - Add `ml/base/sgd-regression/results/float32`
  - Add `ml/base/sgd-regression/results/float64`
  - Add `ml/base/sgd-regression/results/struct-factory`
  - Add `ml/base/sgd-regression/results/to-json`
  - Add `ml/base/sgd-regression/results/to-string`

---

#### Week 11:
- `ml/sgd-regression/ctor` **[ Difficulty: 4/5 ]**
- By the end of this week I expect to have all the packages  implemented necessary for the proper working of `sgd-regression`.
---

#### Week 12:
- This would be a buffer week to finish any leftover work.
  
---

#### Final Week:
- I will document my entire work and submit final evaluation to my mentors.
