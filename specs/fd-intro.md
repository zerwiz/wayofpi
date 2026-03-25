# `fd` File Finder - Introduction

## 📦 What is `fd`?

[`fd`](https://github.com/sharkdp/fd) is a modern, simple, and fast file finder utility. It's written in Rust and designed to be a simpler alternative to the traditional `find` command.

## 🔍 Why Use `fd`?

- **Simplicity**: Cleaner interface than `find`
- **Speed**: Fast file system traversal
- **Unicode support**: Handles filenames with special characters
- **Git integration**: Can search in and outside of `.gitignore`
- **User-friendly**: Sorts results alphabetically by default

## 🎯 Installation

```bash
# On Ubuntu/Debian
sudo apt install fd

# On macOS
brew install fd

# On Arch Linux
sudo pacman -S fd

# Using cargo
cargo install fd
```

## 📖 Quick Start

```bash
# Basic search (case insensitive by default)
fd filename.txt

# Search in specific directories
fd filename.txt /home/user/projects

# Ignore .git directory
fd --no-ignore-vcs filename.txt

# Show file size in human-readable format
fd --size filename.txt

# Find files newer than 7 days
fd --time '+%Y-%m-%d %H:%M:%S' filename.txt
```

## 💡 Common Search Patterns

```bash
# Search for hidden files
fd -H filename.txt

# Limit max depth (e.g., 3 directories deep)
fd -d 3 filename.txt

# Follow symlinks
fd -L filename.txt

# Include .gitignore files
fd --include .gitignore filename.txt

# Exclude directories
fd --exclude 'node_modules' --exclude 'vendor' filename.txt

# Find by extension
fd .py  # All Python files
fd *.md  # Markdown files (case-sensitive)

# Find with specific permissions
fd -p '0644' filename.txt
```

## 🚀 Tips

1. **Combine with grep**: `fd pattern | xargs grep pattern`
2. **With grep**: `fd .py | xargs grep -R -e pattern`
3. **Count matches**: `fd pattern | wc -l`
4. **Invert search**: `fd -i filename.txt` (ignore case)

## 📌 Next Steps

- Explore the [fd documentation](https://github.com/sharkdp/fd/blob/master/README.md)
- Try the interactive help: `fd -h`
- Check advanced options with `fd --help`

Happy hunting! 🎯