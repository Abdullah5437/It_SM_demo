import CategoryForm from "../components/category_form/CategoryForm"
import { RequireAuth } from "../components/auth/RequireAuth"

export default (() => {
    return (
        <RequireAuth>
            <CategoryForm />
        </RequireAuth>
    )
})