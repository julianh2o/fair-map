import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthContext } from './contexts/AuthContext';
import { AuthUser } from './services/authService';

/**
 * Mock user for testing
 */
export const createMockUser = (overrides?: Partial<AuthUser>): AuthUser => {
	return {
		id: 'test-user-id',
		name: 'Test User',
		phone: '+15555551234',
		...overrides,
	};
};

/**
 * Mock AuthContext provider for testing
 */
interface MockAuthProviderProps {
	children: ReactNode;
	user?: AuthUser | null;
	loading?: boolean;
	login?: (user: AuthUser, token: string) => void;
	logout?: () => void;
	refreshUser?: () => Promise<void>;
}

export const MockAuthProvider: React.FC<MockAuthProviderProps> = ({
	children,
	user = null,
	loading = false,
	login = vi.fn(),
	logout = vi.fn(),
	refreshUser = vi.fn().mockResolvedValue(undefined),
}) => {
	return <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>{children}</AuthContext.Provider>;
};

/**
 * Options for renderWithProviders
 */
interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
	user?: AuthUser | null;
	loading?: boolean;
	initialRoute?: string;
}

/**
 * Renders a component with all necessary providers (Router + Auth)
 */
export const renderWithProviders = (
	ui: ReactElement,
	{ user = null, loading = false, initialRoute = '/', ...renderOptions }: RenderWithProvidersOptions = {},
) => {
	window.history.pushState({}, 'Test page', initialRoute);

	const Wrapper = ({ children }: { children: ReactNode }) => {
		return (
			<BrowserRouter>
				<MockAuthProvider user={user} loading={loading}>
					{children}
				</MockAuthProvider>
			</BrowserRouter>
		);
	};

	return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Renders a component with just the Router (no Auth)
 */
export const renderWithRouter = (
	ui: ReactElement,
	{ initialRoute = '/', ...renderOptions }: { initialRoute?: string } & Omit<RenderOptions, 'wrapper'> = {},
) => {
	window.history.pushState({}, 'Test page', initialRoute);

	const Wrapper = ({ children }: { children: ReactNode }) => {
		return <BrowserRouter>{children}</BrowserRouter>;
	};

	return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Mock localStorage
 */
export const mockLocalStorage = () => {
	const storage: Record<string, string> = {};

	return {
		getItem: vi.fn((key: string) => storage[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			storage[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete storage[key];
		}),
		clear: vi.fn(() => {
			Object.keys(storage).forEach((key) => delete storage[key]);
		}),
		get length() {
			return Object.keys(storage).length;
		},
		key: vi.fn((index: number) => Object.keys(storage)[index] || null),
	};
};

/**
 * Sets up localStorage mock
 */
export const setupLocalStorageMock = () => {
	const mockStorage = mockLocalStorage();
	Object.defineProperty(window, 'localStorage', {
		value: mockStorage,
		writable: true,
	});
	return mockStorage;
};
