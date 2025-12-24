
import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const COOKIE_NAME = 'clipboard_data';

const getCookie = () => {
    try {
        const match = document.cookie.match(new RegExp('(^| )' + COOKIE_NAME + '=([^;]+)'));
        if (match) {
            return JSON.parse(decodeURIComponent(match[2]));
        }
    } catch (e) {
        console.error("Error reading cookie", e);
    }
    return [];
};

const setCookie = (data) => {
    const d = new Date();
    d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    const value = encodeURIComponent(JSON.stringify(data));
    document.cookie = COOKIE_NAME + "=" + value + ";" + expires + ";path=/";
};

// --- Sortable Item Component ---
function SortableItem({
    item,
    isEditing,
    isCopied,
    onCopy,
    onTogglePin,
    onChange,
    onToggleEdit,
    onDelete,
    isActive // specialized prop to style the dragging item specifically if needed
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative',
    };

    // If dragging, we might want to hide the original or style it
    const itemContent = (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => !isDragging && onCopy(item.value, item.id)}
            className={`
                group flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border transition-all duration-200 select-none
                ${isDragging ? 'opacity-50 shadow-2xl bg-zinc-800 border-zinc-500 scale-105' : ''}
                ${isEditing
                    ? 'bg-[#121214] border-zinc-700 cursor-default ring-1 ring-zinc-700'
                    : item.pinned
                        ? 'bg-zinc-900/50 border-zinc-700/50 hover:border-zinc-600 cursor-pointer'
                        : 'bg-[#121214] border-zinc-800/60 hover:border-zinc-600 hover:bg-zinc-800/30 cursor-pointer active:scale-[0.99]'
                }
            `}
        >
            {/* Pin Indicator/Action - Stop Propagation to prevent drag start on button? 
                 Actually utilizing PointerSensor delay helps, but buttons should stop propagation usually. */}
            <button
                onClick={(e) => onTogglePin(e, item.id)}
                onPointerDown={(e) => e.stopPropagation()}
                className={`shrink-0 p-1.5 rounded-full transition-colors ${item.pinned
                        ? 'text-yellow-400 bg-yellow-400/10'
                        : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800'
                    }`}
                title={item.pinned ? "Unpin" : "Pin"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-45" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
            </button>

            {/* Label Section */}
            <div className="w-full sm:w-1/4">
                {isEditing ? (
                    <input
                        type="text"
                        value={item.name}
                        onChange={(e) => onChange(item.id, 'name', e.target.value)}
                        placeholder="Label"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className={`text-sm font-semibold ${!item.name && 'text-zinc-600 italic'}`}>
                        {item.name || 'Untitled'}
                    </span>
                )}
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-6 bg-zinc-800"></div>

            {/* Value Section */}
            <div className="flex-1 w-full min-w-0 pr-2">
                {isEditing ? (
                    <input
                        type="text"
                        value={item.value}
                        onChange={(e) => onChange(item.id, 'value', e.target.value)}
                        placeholder="Value to copy..."
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-sm text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                    />
                ) : (
                    <div className="flex items-center justify-between w-full">
                        <span className="text-sm text-zinc-300 font-mono truncate mr-4">
                            {item.value || <span className="text-zinc-600 italic">Empty value</span>}
                        </span>
                        {isCopied && (
                            <span className="text-xs text-green-400 font-medium animate-pulse whitespace-nowrap">
                                Copied!
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Actions (Edit/Delete) */}
            <div className="flex items-center gap-2 sm:ml-auto shrink-0">
                <button
                    onClick={(e) => onToggleEdit(e, item.id)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`p-2 rounded-lg transition-colors ${isEditing
                            ? 'bg-blue-600 text-white hover:bg-blue-500'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                        }`}
                    title={isEditing ? "Done" : "Edit"}
                >
                    {isEditing ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                    )}
                </button>

                <button
                    onClick={(e) => onDelete(e, item.id)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-700 rounded-lg transition-colors"
                    title="Delete"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {/* Drag Handle Indicator (Visual only, whole row is triggered by delay) */}
            <div className="hidden group-hover:block absolute left-1 top-1/2 -translate-y-1/2 text-zinc-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
            </div>
        </div>
    );

    return itemContent;
}


export default function ClipboardManager() {
    const [items, setItems] = useState([]);
    const [copiedId, setCopiedId] = useState(null);
    const [isSaved, setIsSaved] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [sortBy, setSortBy] = useState('custom');
    const [activeId, setActiveId] = useState(null); // For drag overlay

    // Sensors Configuration
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                // Require a press-and-hold of 150ms to start dragging
                // This allows short clicks to trigger "Copy"
                delay: 150,
                tolerance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const stored = getCookie();
        if (stored && Array.isArray(stored)) {
            const migrated = stored.map(item => ({ ...item, pinned: item.pinned || false }));
            setItems(migrated);
        } else {
            setItems([{ id: Date.now(), name: 'Example', value: 'https://example.com', pinned: false }]);
        }
    }, []);

    const handleSave = () => {
        setCookie(items);
        setIsSaved(true);
        setHasUnsavedChanges(false);
        setTimeout(() => setIsSaved(false), 2000);
        setEditingId(null);
    };

    const handleAddItem = () => {
        const newId = Date.now();
        setItems([{ id: newId, name: '', value: '', pinned: false }, ...items]);
        setHasUnsavedChanges(true);
        setEditingId(newId);
        if (sortBy !== 'custom') setSortBy('custom');
    };

    const handleDeleteItem = (e, id) => {
        if (e) e.stopPropagation();
        setItems(items.filter(item => item.id !== id));
        setHasUnsavedChanges(true);
    };

    const handleChange = (id, field, newValue) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: newValue } : item
        ));
        setHasUnsavedChanges(true);
    };

    const togglePin = (e, id) => {
        if (e) e.stopPropagation();
        setItems(items.map(item =>
            item.id === id ? { ...item, pinned: !item.pinned } : item
        ));
        setHasUnsavedChanges(true);
    };

    const handleCopy = (text, id) => {
        if (!text || editingId === id) return;
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const toggleEdit = (e, id) => {
        if (e) e.stopPropagation();
        setEditingId(editingId === id ? null : id);
    };

    // Sorting Logic
    const getSortedItems = () => {
        let sorted = [...items];

        const sortFn = (a, b) => {
            if (sortBy === 'name') {
                return (a.name || '').localeCompare(b.name || '');
            } else if (sortBy === 'date') {
                return b.id - a.id;
            }
            return 0;
        };

        if (sortBy !== 'custom') {
            sorted.sort(sortFn);
        }

        const pinned = sorted.filter(i => i.pinned);
        const unpinned = sorted.filter(i => !i.pinned);

        return [...pinned, ...unpinned];
    };

    // Derived state for DnD
    const visibleItems = getSortedItems();

    // Drag Handlers
    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (active.id !== over?.id) {
            setItems((prevItems) => {
                // We need to reorder the *original* items array based on the visual change
                // First, map visible IDs
                const oldIndex = visibleItems.findIndex(i => i.id === active.id);
                const newIndex = visibleItems.findIndex(i => i.id === over.id);

                // If we are just moving things, we can use arrayMove on 'visibleItems' logic
                // But we must construct the new full list.
                // Simpler: perform the move on visibleItems, then concat back if there were hidden items?
                // Here all items are likely visible, just sorted.
                // If sorted by 'name', dragging breaks sort -> custom.

                const newVisible = arrayMove(visibleItems, oldIndex, newIndex);

                return newVisible;
            });
            setHasUnsavedChanges(true);
            setSortBy('custom'); // Auto-switch to custom
        }
    };

    // Find active item object for overlay
    const activeItem = activeId ? items.find(i => i.id === activeId) : null;

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800">
            <div className="max-w-4xl mx-auto px-6 py-12">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
                            Quick Copy
                        </h1>
                        <p className="text-zinc-400 text-sm md:text-base">
                            Hold to drag & reorder. Click to copy.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleAddItem}
                            className="px-5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium text-zinc-200 transition-colors border border-zinc-700 hover:border-zinc-600 outline-none focus:ring-2 focus:ring-zinc-600"
                        >
                            + Add Entry
                        </button>
                        <button
                            onClick={handleSave}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#09090b] ${isSaved
                                    ? 'bg-green-600 hover:bg-green-500 text-white focus:ring-green-600'
                                    : hasUnsavedChanges
                                        ? 'bg-white hover:bg-zinc-200 text-black focus:ring-white'
                                        : 'bg-zinc-100 text-black hover:bg-zinc-200'
                                }`}
                        >
                            {isSaved ? "Saved" : "Save Changes"}
                        </button>
                    </div>
                </header>

                {/* Sort Controls */}
                <div className="flex items-center gap-4 mb-6 text-sm">
                    <span className="text-zinc-500 font-medium">Sort by:</span>
                    <div className="flex gap-1 bg-[#121214] p-1 rounded-lg border border-zinc-800">
                        {['name', 'date', 'custom'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setSortBy(type)}
                                className={`px-3 py-1.5 rounded-md capitalize transition-all ${sortBy === type
                                        ? 'bg-zinc-700 text-white shadow-sm'
                                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                                    }`}
                            >
                                {type === 'date' ? 'Date Created' : type}
                            </button>
                        ))}
                    </div>
                    {/* Instructions hint */}
                    <span className="ml-auto text-xs text-zinc-600 hidden md:block">
                        Hold row to reorder
                    </span>
                </div>

                {/* List Section */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={visibleItems.map(i => i.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-3">
                            {visibleItems.map((item) => (
                                <SortableItem
                                    key={item.id}
                                    item={item}
                                    isEditing={editingId === item.id}
                                    isCopied={copiedId === item.id}
                                    onCopy={handleCopy}
                                    onTogglePin={togglePin}
                                    onChange={handleChange}
                                    onToggleEdit={toggleEdit}
                                    onDelete={handleDeleteItem}
                                />
                            ))}

                            {visibleItems.length === 0 && (
                                <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                                    <p className="text-zinc-500">Your clipboard is empty.</p>
                                </div>
                            )}
                        </div>
                    </SortableContext>

                    {/* Drag Overlay for smooth visual feedback */}
                    <DragOverlay>
                        {activeItem ? (
                            <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-500 bg-zinc-800 shadow-2xl scale-105 opacity-90 cursor-grabbing">
                                <button className="shrink-0 p-1.5 rounded-full text-zinc-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-45" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                                    </svg>
                                </button>
                                <div className="w-1/4">
                                    <span className="text-sm font-semibold text-zinc-200">
                                        {activeItem.name || 'Untitled'}
                                    </span>
                                </div>
                                <div className="hidden sm:block w-px h-6 bg-zinc-600"></div>
                                <div className="flex-1 min-w-0 pr-2">
                                    <span className="text-sm text-zinc-300 font-mono truncate">
                                        {activeItem.value}
                                    </span>
                                </div>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
}
