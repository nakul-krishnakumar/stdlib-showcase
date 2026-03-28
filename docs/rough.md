
- `ml/strided/dsgd-trainer`
	```
	function shared_sgd_train(X, y, params) is
		initialize weights w
		initialize intercept b
		initialize averaged weights aw, ab if averaging is enabled
		initialize iteration counter t
		optionally split validation set if early_stopping = true

		for epoch ← 1 to max_iter do
			if shuffle = true then
				shuffle training order

			epoch_loss ← 0
			no_improvement_count ← 0

			for each sample i in training order do
				x ← X[i]
				target ← y[i]
				sw ← sample_weight[i]

				if sample i belongs to validation set then
					continue

				p ← dot(w, x) + b

				if learning_rate = "optimal" then
					eta ← 1 / (alpha * (t0 + t))
				else if learning_rate = "invscaling" then
					eta ← eta0 / (t ^ power_t)
				else
					eta ← eta0

				loss_value ← loss(target, p)
				grad ← dloss(target, p)

				if learning_rate = "pa1" then
					step ← min(eta0, loss_value / ||x||^2)
					update ← step
				else if learning_rate = "pa2" then
					step ← loss_value / (||x||^2 + 1 / (2 * eta0))
					update ← step
				else
					update ← -eta * grad

				update ← update * sw

				if penalty includes L2 then
					w ← w * max(0, 1 - eta * alpha * (1 - l1_ratio))

				if update ≠ 0 then
					w ← w + update * x

				if fit_intercept then
					b ← b + update

				if penalty includes L1 or ElasticNet then
					apply_soft_thresholding_to_w(w)

				if averaging is enabled and t ≥ average_start then
					aw ← running_average(aw, w)
					ab ← running_average(ab, b)

				epoch_loss ← epoch_loss + loss_value
				t ← t + 1

			if early_stopping = true then
				score ← validation_score(w, b, X_val, y_val)
				if score has not improved for n_iter_no_change epochs then
					stop training

			if training has converged then
				stop training

		if averaging is enabled and average was active long enough then
			return aw, ab
		else
			return w, b
	```

- `ml/strided/dsgd-binary`

	```
	function sgdBinary(X, y) is
    validate params
    classes ← unique(y)

    if warm_start and existing model exists then
        reuse previous weights and intercept
    else
        allocate coefficients and intercept

    if number of classes = 2 then
        y_binary ← encode labels for binary loss
        w, b ← shared_sgd_train(X, y_binary, classification params)
        store w and b as a 1-row model

    else
        for each class c in classes do
            y_c ← 1 if y == c else 0 or -1 depending on loss
            train one binary classifier "c vs rest" using shared_sgd_train
            store its w_c and b_c
        end for

    set n_iter_ and t_
    choose averaged or standard parameters if averaging is enabled
    return self
	```


