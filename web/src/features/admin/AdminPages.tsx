import { AdminExercisesPage as ExerciseListPage, AdminExerciseEditorPage } from './AdminExercisePages';
import { AdminFoodEditorPage, AdminFoodsPage as FoodListPage } from './AdminFoodPages';
import { AdminDashboardPage as DashboardPage, AdminUserDetailPage, AdminUsersPage as UsersPage } from './AdminDashboardUsersPages';

export function AdminDashboardPage() { return <DashboardPage />; }
export function AdminUsersPage() { return <UsersPage />; }
export { AdminUserDetailPage };
export function AdminExercisesPage() { return <ExerciseListPage />; }
export { AdminExerciseEditorPage };
export function AdminFoodsPage() { return <FoodListPage />; }
export { AdminFoodEditorPage };
