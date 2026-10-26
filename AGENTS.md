<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Product-level analytics aggregate historical sale item names within their recorded categories, so charts retain sales for renamed or removed inventory items.
- Store loading only reads account records; clearing deletes account-scoped records without inserting replacements, so an empty kiosk stays empty.
- Checkout saves the user-selected local calendar date at noon through the existing sale builder, so reports group backdated sales by the intended day.
