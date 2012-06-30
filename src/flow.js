define(["sprout/util", "sprout/base"], function (_, base) {
	/**
     * Checks whether an instruction condition passes.
     * @private
     * @param {Boolean|Function|Array|Object} condition A boolean, function, array of promises, or one promise to check.
     * @return {Boolean} Returns true if the condition passes, false otherwise.
     */
	function passes (condition)
	{
		// If the condition is a boolean then just use its value
		if (_.isBoolean(condition)) {
			return condition;
		}
		// Else if the condition is a function then use its return value
		else  if (_.isFunction(condition)) {
			return condition();
		}
		// Else if the condition is an array of promises then use their states
		else if (_.isArray(condition)) {
			return !_.any(condition, function (promise) {
				return promise.state() === 'rejected';
			});
		}

		return false;
	}

	/**
     * Runs an instruction.
     * @private
     * @param {Object} instruction The instruction to execute.
     */
	function runInstruction (instruction)
	{
		switch (instruction.type) {
		case 'wait':
			// Delay execution of the next instruction
			this.timeout = setTimeout(_.bind(runNextInstruction, this), instruction.delay);
			break;
		case 'waitIf':
			// If the delay should be applied then delay execution of the next instruction
			if (passes(instruction.condition)) {
				this.timeout = setTimeout(_.bind(runNextInstruction, this), instruction.delay);
			}
			// Else Execute the next instruction now
			else {
				runNextInstruction.call(this);
			}
			break;
		case 'run':
			// Invoke the function
			instruction.func.apply(instruction.context, instruction.args);

			// Execute the next instruction
			runNextInstruction.call(this);
			break;
		case 'runIf':
			// If any of the promises have been rejected at this point then do not invoke the function
			//if (!_.any(instruction.promises, function (promise) { return promise.state() === 'rejected'; })) {
			if (passes(instruction.condition)) {
				instruction.func.apply(instruction.context, instruction.args);
			}

			// Execute the next instruction
			runNextInstruction.call(this);
			break;
		case 'runIfNot':
			// If any of the promises have been rejected at this point then invoke the function
			//if (_.any(instruction.promises, function (promise) { return promise.state() === 'rejected'; })) {
			if (!passes(instruction.condition)) {
				instruction.func.apply(instruction.context, instruction.args);
			}

			// Execute the next instruction
			runNextInstruction.call(this);
			break;
		case 'done':
			this.destroy();
			break;
		default:
			// This is an unknown instruction so just move on to the next
			runNextInstruction.call(this);
			break;
		}
	}

	/**
     * Runs the next instruction in the queue.
     * @private
     */
	function runNextInstruction ()
	{
		this.timeout = null;

		if (this.instructions.length > 0) {
			runInstruction.call(this, this.instructions.shift());
		}
		else {
			this.running = false;
		}
	}

	/**
     * If instructions are not currently being exected then this starts them up.
     * @private
     */
	function startInstructions ()
	{
		if (!this.running) {
			this.running = true;
			runNextInstruction.call(this);
		}
	}

	/**
     * @class flow
     * A flow objects helps chain together asynchronous operations. After creating a flow object you pass it instructions to run which it executes one after the other.
     * <pre><code>
     *     var anim = flow.create();
     *     anim.wait(150).run(slide, this, item).wait(350).run(fadeOut, this, this.fadeLists);
     *     ...
     *     anim.destroy();
     * </code></pre>
     * The above code creates a flow object and tells it to wait 150 ms before sliding an item. And then to wait another 350 ms after that before fading out some lists.
     * <br/><br/>
     * One off flows can be created without having to worry about calling destory on the flow object once it is done executing its instructions.
     * This is possible by calling the done method as the last instruction.
     * <pre><code>
     *     flow.create().wait(150).run(slide, this, item).wait(350).run(fadeOut, this, this.fadeLists).done();
     * </code></pre>
     * The above code will create a flow object, wait 150 ms, slide an item, wait 350 ms, fade some lists out, and then destroy itself.
     * <br/><br/>
     * When an instruction is added to an empty flow it is executed immediately.
     * @extends base
     */
	return base.extend({
		/**
         * Initializes the flow object.
         */
		constructor: function ()
		{
			base.constructor.call(this);

			this.instructions = [];
			this.running = false;
			this.timeout = null;
		},

		/**
         * Deinitializes the object.
         */
		destructor: function ()
		{
			this.clear();
			this.instructions = null;

			base.destructor.call(this);
		},

		/**
         * A flow instruction. Add this instruction to a flow object to cause it to destroy itself.
         * @return {Object} Returns itself for chaining.
         */
		done: function ()
		{
			this.instructions.push({
				type: 'done'
			});

			startInstructions.call(this);

			return this;
		},

		/**
         * A flow instruction. Clears all instructions that have not been executed yet. Any instructions delayed to run by the wait instruction are also cleared.
         * @return {Object} Returns itself for chaining.
         */
		clear: function ()
		{
			this.instructions = [];
			this.running = false;

			if (this.timeout !== null) {
				clearTimeout(this.timeout);
			}

			return this;
		},

		/**
         * A flow instruction. Add this instruction to delay execution of the following instructions by a specified number of milliseconds.
         * @param {Number} delay The number of milliseconds to delay execution of the following instructions.
         * @return {Object} Returns itself for chaining.
         */
		wait: function (delay)
		{
			this.instructions.push({
				type: 'wait',
				delay: delay
			});

			startInstructions.call(this);

			return this;
		},

		/**
         * A flow instruction. Add this instruction to delay execution of the following instructions by a specified number of milliseconds.
         * The delay is only applied if the condition resolves to false. The condition can be a boolean, function (that returns truthy or falsy), or promises.
         * If the promises have not been reject or any of the other condition types are truthy then the delay is applied.
         * @param {Boolean|Function|Array|Object} condition A boolean, function, array of promises, or one promise to check against before applying the delay.
         * @param {Number} delay The number of milliseconds to delay execution of the following instructions.
         * @return {Object} Returns itself for chaining.
         */
		waitIf: function (condition, delay)
		{
			this.instructions.push({
				type: 'waitIf',
				condition: condition,
				delay: delay
			});

			startInstructions.call(this);

			return this;
		},

		/**
         * A flow instruction. Add this instruction to a flow object to cause a function to be invoked.
         * @param {Function} func The function to run.
         * @param {Object} context (Optional) The context to run the function in. Defaults to undefined.
         * @param {...} args (Optional) Any remaining arguments are passed as arguments to the function.
         * @return {Object} Returns itself for chaining.
         */
		run: function (func, context)
		{
			this.instructions.push({
				type: 'run',
				func: func,
				context: context,
				args: _.toArray(arguments).slice(2)
			});

			startInstructions.call(this);

			return this;
		},

		/**
         * A flow instruction. Add this instruction to a flow object to cause a function to be invoked.
         * The function is only invoked if the condition passes.
         * This means promises that are pending or resolved will invoke the function.
         * @param {Boolean|Function|Array|Object} condition A boolean, function, array of promises, or one promise to check against before invoking the function.
         * @param {Function} func The function to run.
         * @param {Object} context (Optional) The context to run the function in. Defaults to undefined.
         * @param {...} args (Optional) Any remaining arguments are passed as arguments to the function.
         * @return {Object} Returns itself for chaining.
         */
		runIf: function (condition, func, context)
		{
			this.instructions.push({
				type: 'runIf',
				condition: _.isArray(condition) ? condition : [condition],
				func: func,
				context: context,
				args: _.toArray(arguments).slice(3)
			});

			startInstructions.call(this);

			return this;
		},

		/**
         * A flow instruction. Add this instruction to a flow object to cause a function to be invoked.
         * The function is only invoked if the condition does not pass.
         * This means promises that are pending or resolved will not invoke the function.
         * @param {Boolean|Function|Array|Object} condition A boolean, function, array of promises, or one promise to check against before invoking the function.
         * @param {Function} func The function to run.
         * @param {Object} context (Optional) The context to run the function in. Defaults to undefined.
         * @param {...} args (Optional) Any remaining arguments are passed as arguments to the function.
         * @return {Object} Returns itself for chaining.
         */
		runIfNot: function (condition, func, context)
		{
			this.instructions.push({
				type: 'runIfNot',
				condition: _.isArray(condition) ? condition : [condition],
				func: func,
				context: context,
				args: _.toArray(arguments).slice(3)
			});

			startInstructions.call(this);

			return this;
		}
	});
});