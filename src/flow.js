define(["sprout/util", "sprout/base"], function (_, base) {
	function runInstruction (instruction)
	{
		switch (instruction.type) {
		case 'wait':
			// Delay execution of the next instruction
			this.timeout = setTimeout(_.bind(runNextInstruction, this), instruction.delay);
			break;
		case 'run':
			// Invoke the function
			instruction.func.apply(instruction.context, instruction.args);

			// Execute the next instruction
			runNextInstruction.call(this);
			break;
		case 'runIf':
			// If any of the promises have been rejected at this point then do not invoke the function
			if (!_.any(instruction.promises, function (promise) { return promise.state() === 'rejected'; })) {
				instruction.func.apply(instruction.context, instruction.args);
			}

			// Execute the next instruction
			runNextInstruction.call(this);
			break;
		case 'runIfNot':
			// If any of the promises have been rejected at this point then invoke the function
			if (_.any(instruction.promises, function (promise) { return promise.state() === 'rejected'; })) {
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

	function startInstructions ()
	{
		if (!this.running) {
			this.running = true;
			runNextInstruction.call(this);
		}
	}

	return base.extend({
		constructor: function ()
		{
			base.constructor.call(this);

			this.instructions = [];
			this.running = false;
			this.timeout = null;
		},

		destructor: function ()
		{
			this.clear();
			this.instructions = null;

			base.destructor.call(this);
		},

		done: function ()
		{
			this.instructions.push({
				type: 'done'
			});

			startInstructions.call(this);

			return this;
		},

		clear: function ()
		{
			this.instructions = [];
			this.running = false;

			if (this.timeout !== null) {
				clearTimeout(this.timeout);
			} 

			return this;
		},

		wait: function (delay)
		{
			this.instructions.push({
				type: 'wait',
				delay: delay
			});

			startInstructions.call(this);

			return this;
		},

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

		runIf: function (promises, func, context)
		{
			this.instructions.push({
				type: 'runIf',
				promises: _.isArray(promises) ? promises : [promises],
				func: func,
				context: context,
				args: _.toArray(arguments).slice(3)
			});

			startInstructions.call(this);

			return this;
		},

		runIfNot: function (promises, func, context)
		{
			this.instructions.push({
				type: 'runIfNot',
				promises: _.isArray(promises) ? promises : [promises],
				func: func,
				context: context,
				args: _.toArray(arguments).slice(3)
			});

			startInstructions.call(this);

			return this;
		}
	});
});