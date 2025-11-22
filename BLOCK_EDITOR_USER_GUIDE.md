# 📝 Block Editor User Guide

## 🎯 Overview

The Block Editor is a Notion-style rich text editor that allows you to create structured, formatted content using different types of blocks. Each block can be a different type of content: text, headings, lists, code, math equations, images, and more.

---

## 🚀 Getting Started

### Opening a Note

1. Click on any node in the graph to open the Note Panel
2. The Note Panel will display on the right side
3. The "Detailed Note" section now uses the Block Editor

### First Time Use

- If you have existing notes, they will be **automatically migrated** to the new block format
- Your original content will be preserved and enhanced with proper formatting
- No manual action needed!

---

## 🧱 Block Types

### Basic Blocks

#### 📄 Text Block
- **Default block type**
- Use for paragraphs and general content
- Press `Enter` to create a new text block

#### 📌 Heading Blocks
- **Heading 1**: Large, bold titles (`# Title` or type `/h1`)
- **Heading 2**: Medium section headers (`## Section` or `/h2`)
- **Heading 3**: Small subsection headers (`### Subsection` or `/h3`)

#### 📋 List Blocks
- **Bullet List**: Unordered list items (`- Item` or `/bullet`)
- **Numbered List**: Ordered list items (`1. Item` or `/numbered`)
- **Todo List**: Checkable task items (`[ ] Task` or `/todo`)

#### 💬 Quote Block
- Block quotes for emphasis (`> Quote` or `/quote`)
- Great for highlighting important information

#### ➖ Divider
- Horizontal line to separate sections (`---` or `/divider`)

### Advanced Blocks

#### 💻 Code Block
- Multi-line code with syntax highlighting
- Type `/code` to create
- Select language from dropdown (JavaScript, Python, Java, etc.)
- Monospace font for better readability

#### ∫ LaTeX Block
- Mathematical equations and formulas
- Type `/latex` to create
- Toggle between edit and preview mode
- Support for inline and display math
- Example: `x^2 + y^2 = z^2`

#### 🖼️ Image Block
- Upload and display images
- Type `/image` to create
- Drag & drop or click to upload
- Add captions to your images
- Supports: JPG, PNG, GIF, WebP

#### 📎 File Block
- Attach any type of file
- Type `/file` to create
- Shows file name, size, and type
- Download button for retrieval

---

## ⌨️ Keyboard Shortcuts

### Navigation

| Shortcut | Action |
|----------|--------|
| `Enter` | Create new block below |
| `Backspace` (at start) | Delete empty block, merge with previous |
| `↑` Arrow Up | Move to previous block |
| `↓` Arrow Down | Move to next block |
| `Shift + Enter` | New line within block (no new block) |

### Slash Commands

| Command | Creates |
|---------|---------|
| `/` | Open command menu |
| `/text` | Text block |
| `/h1`, `/h2`, `/h3` | Heading blocks |
| `/bullet` | Bullet list |
| `/numbered` | Numbered list |
| `/todo` | Todo list |
| `/code` | Code block |
| `/latex` | LaTeX math |
| `/image` | Image upload |
| `/file` | File attachment |
| `/quote` | Quote block |
| `/divider` | Horizontal divider |

### Slash Command Menu

1. Type `/` in any text block
2. Menu appears with all available block types
3. Type to filter (e.g., `/h` shows only headings)
4. Use `↑` `↓` to navigate menu
5. Press `Enter` or click to select
6. Press `Esc` to close menu

---

## 🎨 Block Manipulation

### Drag & Drop

- Hover over any block to see the **drag handle** (⋮⋮) on the left
- Click and drag to reorder blocks
- Visual feedback shows where block will be dropped

### Block Actions Menu

- Hover over any block to see the **three-dot menu** (⋯) on the right
- Click to open actions menu:
  - **📋 Duplicate**: Create a copy below current block
  - **📄 Copy**: Copy block as JSON to clipboard
  - **🗑️ Delete**: Remove block (minimum 1 block always remains)

### Copy & Paste

- Use the **Copy** action to copy a block
- Press `Ctrl+V` anywhere to paste
- Block structure and formatting preserved

---

## 💡 Tips & Tricks

### Markdown Import
When migrating old notes, the editor automatically detects:
- `# Headings` → Heading blocks
- `- Lists` → Bullet list blocks
- `` ```code``` `` → Code blocks
- `$$math$$` → LaTeX blocks
- `---` → Dividers
- `> Quotes` → Quote blocks

### Quick Formatting
- Start typing markdown syntax, it converts to blocks automatically
- Type `/` for quick block type changes
- Use headings to organize long documents

### Code Blocks
- Select language for syntax highlighting
- Useful for: code snippets, configuration files, logs
- Supports 10+ languages

### LaTeX Math
- Toggle between edit and preview
- Use inline mode for formulas in text
- Use display mode for centered equations

### Images & Files
- Stored in IndexedDB for offline access
- Images show inline preview
- Files show with appropriate icons

---

## 💾 Saving & Storage

### Auto-Save
- All changes are **automatically saved** to IndexedDB
- No need to manually save
- Save status shown at bottom: "💾 Saving..." → "✓ HH:MM"

### Storage Format
- **Version 2.0** block format
- Each block has: id, type, content, metadata, timestamps
- Backwards compatible with old text notes (auto-migration)

### Data Location
- **Summary & Tags**: localStorage (visible in graph)
- **Detailed Blocks**: IndexedDB (loaded on-demand)

---

## 🔧 Troubleshooting

### Editor Not Loading
1. Check browser console for errors
2. Try refreshing the page
3. Clear browser cache and storage
4. Ensure IndexedDB is enabled

### Lost Content
- Content is auto-saved continuously
- Check IndexedDB in browser DevTools
- Legacy text notes are preserved during migration

### Block Errors
- If a block fails to render, error boundary shows fallback
- Click "Try Again" to retry
- Click "Use Simple Text Editor" for basic fallback

### Performance Issues
- Large documents (100+ blocks) may load slower
- Consider splitting into multiple notes
- Images stored as base64 may increase size

---

## 📊 Migration Details

### Automatic Migration
- Happens on first load of old notes
- Parses markdown syntax
- Preserves all content
- Creates appropriate block types
- Saves in new format

### What Gets Migrated
✅ Plain text → Text blocks  
✅ `# Headings` → Heading blocks  
✅ `- Lists` → List blocks  
✅ `` ```Code``` `` → Code blocks  
✅ `$$Math$$` → LaTeX blocks  
✅ `---` → Dividers  
✅ `> Quotes` → Quote blocks  

### Migration Safety
- Original data never deleted
- Can export back to plain text if needed
- Fully reversible process

---

## 🎓 Best Practices

### Document Structure
1. Start with a Heading 1 for title
2. Use Heading 2 for main sections
3. Use Heading 3 for subsections
4. Separate sections with dividers

### Content Organization
- One idea per block
- Use lists for related items
- Code blocks for technical content
- LaTeX for mathematical content
- Images to visualize concepts

### Collaboration Ready
- Clear block structure
- Semantic formatting
- Exportable format
- Copy/paste friendly

---

## 🆘 Support

### Common Issues

**Q: Can I use old-style plain text?**  
A: The editor automatically handles text, but blocks provide more features.

**Q: How do I export my notes?**  
A: Use the Copy action on blocks, or implement export feature.

**Q: Are my notes backed up?**  
A: They're stored locally in IndexedDB. Consider browser sync or export.

**Q: Can I use this offline?**  
A: Yes! All content is stored locally in your browser.

### Need Help?
- Check browser console for errors
- Review this guide for features
- Report issues to development team

---

## 🎉 Enjoy Your Block Editor!

You now have a powerful, flexible note-taking system. Experiment with different block types, use slash commands for speed, and organize your knowledge effectively!

**Pro tip**: Type `/` and explore all available blocks. You'll discover new ways to structure your notes! 🚀
