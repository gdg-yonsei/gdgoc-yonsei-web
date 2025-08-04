/**
 * @file This file defines global application states using Jotai atoms.
 * These atoms are used to manage and share state across different components.
 */

import { atom } from 'jotai';

/**
 * Atom to track whether a user authentication process is currently in progress.
 * @returns {boolean} - True if authentication is in progress, otherwise false.
 */
export const isAuthenticatingState = atom(false);

/**
 * Atom to manage the visibility of the main menu bar.
 * @returns {boolean} - True if the menu bar is open, otherwise false.
 */
export const menuBarState = atom(false);

/**
 * A derived atom that represents the global loading state of the application.
 * It is true if any of the specific upload processes (single image, multiple images, profile image) are active.
 * This is useful for disabling UI elements like submit buttons during critical background tasks.
 * @returns {boolean} - True if any upload is in progress, otherwise false.
 */
export const isLoadingState = atom((get) =>
  get(uploadSingleImageState) ||
  get(uploadMultipleImagesState) ||
  get(uploadProfileImageState),
);

/**
 * Atom to track the status of a single image upload.
 * @returns {boolean} - True if a single image is being uploaded, otherwise false.
 */
export const uploadSingleImageState = atom(false);

/**
 * Atom to track the status of multiple image uploads.
 * @returns {boolean} - True if multiple images are being uploaded, otherwise false.
 */
export const uploadMultipleImagesState = atom(false);

/**
 * Atom to track the status of a user profile image upload.
 * @returns {boolean} - True if a profile image is being uploaded, otherwise false.
 */
export const uploadProfileImageState = atom(false);

/**
 * Atom to manage the state of the home page's top menu bar.
 * @returns {boolean} - True if the home page menu bar is active/visible, otherwise false.
 */
export const homeMenuBarState = atom(false);

/**
 * Atom to store the currently selected generation ID or name.
 * @returns {string} - The identifier of the selected generation.
 */
export const generationState = atom('');

/**
 * Atom to manage the state of a generic modal dialog.
 * It holds the text to be displayed and the action to be executed on confirmation.
 * @returns {{text: string, action: () => void}} - An object with the modal's text and action.
 */
export const modalState = atom({
  text: '',
  action: () => {},
});