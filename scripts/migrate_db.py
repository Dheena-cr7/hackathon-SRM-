import sqlite3

conn = sqlite3.connect('data/campusops.db')
c = conn.cursor()
c.execute('DROP TABLE IF EXISTS parts_reservations')
c.execute('''
CREATE TABLE parts_reservations (
    id VARCHAR(36) PRIMARY KEY,
    work_order_id VARCHAR(36) REFERENCES work_orders(id) ON DELETE CASCADE,
    item_id VARCHAR(36) NOT NULL REFERENCES inventory_items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'reserved',
    created_at DATETIME NOT NULL
)
''')

# Ensure all campus buildings have at least one room
c.execute("INSERT OR IGNORE INTO rooms (id, building_id, room_number, floor_number, room_type, capacity, is_operational) VALUES ('RM-ADM-101', 'BLD-ADM-01', 'A101', 1, 'office', 25, 1)")
c.execute("INSERT OR IGNORE INTO rooms (id, building_id, room_number, floor_number, room_type, capacity, is_operational) VALUES ('RM-LIB-101', 'BLD-LIB-01', 'L101', 1, 'seminar', 40, 1)")
c.execute("INSERT OR IGNORE INTO rooms (id, building_id, room_number, floor_number, room_type, capacity, is_operational) VALUES ('RM-RES-101', 'BLD-RES-01', 'H101', 1, 'seminar', 30, 1)")

# Ensure work order exists
c.execute("SELECT id FROM incidents WHERE status != 'resolved' LIMIT 1")
inc_row = c.fetchone()
if inc_row:
    inc_id = inc_row[0]
    c.execute("SELECT id FROM work_orders WHERE incident_id = ?", (inc_id,))
    if not c.fetchone():
        c.execute("INSERT INTO work_orders (id, order_number, incident_id, priority, status, assigned_technician_id, estimated_duration_hours, created_at, updated_at) VALUES ('WO-2026-0001', 'WO-2026-0001', ?, 'critical', 'assigned', '59fad526-6182-40d9-8d52-6b4138c04ea1', 2.0, datetime('now'), datetime('now'))", (inc_id,))

conn.commit()
conn.close()
print("Migration and room seed successful!")
