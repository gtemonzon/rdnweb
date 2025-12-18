// Module types
export type ModuleName = 'blog' | 'crowdfunding' | 'reports' | 'donations' | 'content' | 'partners' | 'receipts' | 'transparency' | 'vacancies';

// Standard permissions that apply to all modules
export interface ModulePermissions {
  can_view: boolean;
  can_create: boolean;
  can_edit_own: boolean;
  can_edit_all: boolean;
  can_publish: boolean;
  can_delete_own: boolean;
  can_delete_all: boolean;
  custom_settings: Record<string, unknown>;
}

// All module permissions mapped by module name
export type AllModulePermissions = Partial<Record<ModuleName, ModulePermissions>>;

// Default permissions (no access)
export const defaultModulePermissions: ModulePermissions = {
  can_view: false,
  can_create: false,
  can_edit_own: false,
  can_edit_all: false,
  can_publish: false,
  can_delete_own: false,
  can_delete_all: false,
  custom_settings: {},
};

// Full permissions (admin)
export const fullModulePermissions: ModulePermissions = {
  can_view: true,
  can_create: true,
  can_edit_own: true,
  can_edit_all: true,
  can_publish: true,
  can_delete_own: true,
  can_delete_all: true,
  custom_settings: {},
};

// Module labels in Spanish
export const moduleLabels: Record<ModuleName, string> = {
  blog: 'Blog',
  crowdfunding: 'Crowdfunding',
  reports: 'Reportes',
  donations: 'Donaciones',
  content: 'Contenido',
  partners: 'Aliados',
  receipts: 'Recibos FEL',
  transparency: 'Transparencia',
  vacancies: 'Vacantes',
};

// Permission labels in Spanish
export const permissionLabels: Record<keyof Omit<ModulePermissions, 'custom_settings'>, string> = {
  can_view: 'Puede ver',
  can_create: 'Puede crear',
  can_edit_own: 'Puede editar propios',
  can_edit_all: 'Puede editar todos',
  can_publish: 'Puede publicar',
  can_delete_own: 'Puede eliminar propios',
  can_delete_all: 'Puede eliminar todos',
};

// Blog-specific custom settings
export interface BlogCustomSettings {
  allowed_categories?: string[];
}

// All blog categories
export const allBlogCategories = ["Noticias", "Impacto", "Historias", "Prevención", "Alianzas", "Incidencia"];
