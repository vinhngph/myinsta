import sqlite3


class SQL:
    def __init__(self, database_url):
        self.database_url = database_url

    def execute(self, query, args=()):
        try:
            with sqlite3.connect(self.database_url) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute(query, args)

                if query.strip().upper().startswith("SELECT"):
                    return [dict(row) for row in cursor.fetchall()]
                else:
                    conn.commit()
                    return None

        except sqlite3.Error as e:
            print(f"Database erro: {e}")
            return None
