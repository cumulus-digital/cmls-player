import { Signal } from '@preact/signals';

export default class ClassNameSet extends Set {
	/**
	 * @param {Set<string>|Signal<string[]|string>|string[]|string} values
	 * @returns {ClassNameSet}
	 */
	constructor(values) {
		super(ClassNameSet.generateArrayFromValues(values));
	}

	/**
	 * Generate an array from a given Set, Array, or class name string.
	 * @param {Set<string>|Signal<string[]|string>|string[]|String} values
	 * @returns {Array}
	 */
	static generateArrayFromValues(values) {
		let valuesArray;
		if (values instanceof Set) {
			valuesArray = values.values();
		} else if (values instanceof Signal) {
			valuesArray = ClassNameSet.generateArrayFromValues(values.value);
		} else if (Array.isArray(values)) {
			valuesArray = values;
		} else {
			valuesArray = new String(values).trim().split(' ');
		}
		return valuesArray;
	}

	/**
	 * Generate a ClassNameSet from a given Set, Array, or class name string.
	 * @param {Set<string>|Signal<string[]|string>|string[]|string} values
	 * @returns {ClassNameSet}
	 */
	static generateClassSetFromValues(values) {
		let valuesArray = ClassNameSet.generateArrayFromValues(values);
		return new ClassNameSet(valuesArray);
	}

	/**
	 * Add many class names to the ClassNameSet
	 * @param {Set<string>|string[]|string} toAdd Class names to add
	 * @returns {ClassNameSet}
	 */
	addMany(toAdd) {
		const toAddSet = ClassNameSet.generateClassSetFromValues(toAdd);
		toAddSet.forEach((item) => this.add(item));
		//return this;
	}

	/**
	 * Remove one or more values from the set
	 * @param {Set<string>|string[]|string} toDelete
	 * @returns {ClassSet}
	 */
	deleteMany(toDelete) {
		const toDeleteSet = ClassNameSet.generateClassSetFromValues(toDelete);
		toDeleteSet.forEach((item) => this.delete(item));
		//return this;
	}

	/**
	 * Remove all but given value(s) from the set
	 * @param {Set<string>|string[]|string} toKeep
	 * @returns {ClassSet}
	 */
	deleteExcept(toKeep) {
		const toKeepSet = ClassNameSet.generateClassSetFromValues(toKeep);
		this.forEach((item) => {
			if (!toKeepSet.has(item)) {
				this.delete(item);
			}
		});
		return this;
	}

	/**
	 * Toggle a value set or delete
	 * @param {string} value
	 */
	toggle(value) {
		if (this.has(value)) {
			this.delete(value);
		} else {
			this.add(value);
		}
	}

	/**
	 * Generate a CSS class name string
	 * @returns {string}
	 */
	toClassNameString() {
		return Array.from(this.values()).join(' ');
	}

	toString() {
		return this.toClassNameString();
	}

	valueOf() {
		return this.toClassNameString();
	}

	toJSON() {
		return this.toClassNameString();
	}
}
