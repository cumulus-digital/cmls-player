import { Signal } from '@preact/signals';
import ClassNameSet from './ClassNameSet';
import { useMemo } from 'preact/hooks';

export class ClassNameSignal extends Signal {
	classSet;

	constructor(value) {
		super(value);
		this.classSet = new ClassNameSet(this.value);
	}

	/**
	 * Add a class name to the set
	 * @param {*} val
	 */
	add(val) {
		this.classSet.add(val);
		this.value = this.classSet.toClassNameString();
	}

	/**
	 * Add many class names to the ClassNameSignal
	 * @param {Set<string>|string[]|string} toAdd Class names to add
	 */
	addMany(toAdd) {
		this.classSet.addMany(toAdd);
		this.value = this.classSet.toClassNameString();
	}

	/**
	 * Delete a class name from the set
	 * @param {*} val
	 */
	delete(val) {
		this.classSet.delete(val);
		this.value = this.classSet.toClassNameString();
	}

	/**
	 * Remove one or more values from the set
	 * @param {Set<string>|string[]|string} toDelete
	 */
	deleteMany(toDelete) {
		this.classSet.deleteMany(toDelete);
		this.value = this.classSet.toClassNameString();
	}

	/**
	 * Remove all but given value(s) from the set
	 * @param {Set<string>|string[]|string} toKeep
	 */
	deleteExcept(toKeep) {
		this.classSet.deleteExcept(toKeep);
		this.value = this.classSet.toClassNameString();
	}

	/**
	 * Remove all classes
	 * @param {*} val
	 */
	clear() {
		this.classSet.clear();
		this.value = this.classSet.toClassNameString();
	}

	/**
	 * Retrieve the entries from the set
	 * @returns {IterableIterator}
	 */
	entries() {
		return this.classSet.entries();
	}

	/**
	 * Execute a function on each value of the set
	 * @param {Function} callbackFn
	 * @param {Object?} thisArg
	 * @returns {undefined}
	 */
	forEach(callbackFn, thisArg = this.classSet) {
		this.classSet.forEach(callbackFn, thisArg);
		this.value = this.classSet.toClassNameString();
	}

	/**
	 * Determine if the given value exists in the set
	 * @param {*} val
	 * @returns {boolean}
	 */
	has(val) {
		return this.classSet.has(val);
	}

	/**
	 * Alias for values() method
	 * @returns {IterableIterator}
	 */
	keys() {
		return this.classSet.keys();
	}

	toggle(value) {
		this.classSet.toggle(value);
	}

	/**
	 * Retrieve the values of the set
	 * @returns {IterableIterator}
	 */
	values() {
		return this.classSet.values();
	}

	/**
	 * @param {string} val
	 */
	set value(value) {
		this.classSet = new ClassNameSet(value);
		super.value = this.classSet.toClassNameString();
	}

	get value() {
		return super.value;
	}
}

export function useClassNameSignal(value) {
	return useMemo(() => new ClassNameSignal(value), []);
}
