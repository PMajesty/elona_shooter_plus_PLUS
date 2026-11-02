// Сгенерировано tools/extract_campaign_enemies.py из исходных кадров SWF.
export interface EnemyFrameAction { jump?: number; stop?: boolean; damage?: boolean; alert?: boolean; attacked?: boolean; shadow?: boolean }
export interface EnemyTimeline { labels: Record<string, number>; count: number; frames: Record<number, EnemyFrameAction> }
export const ENEMY_TIMELINES: Record<string, EnemyTimeline> = {
  "cata": {
    "labels": {
      "init": 1,
      "alive": 3,
      "attack": 14,
      "dead": 163,
      "null": 279
    },
    "count": 279,
    "frames": {
      "1": {
        "shadow": true
      },
      "11": {
        "jump": 3
      },
      "151": {
        "jump": 14
      },
      "14": {
        "alert": true
      },
      "113": {
        "damage": true
      },
      "194": {
        "stop": true
      }
    }
  },
  "spider": {
    "labels": {
      "init": 1,
      "alive": 3,
      "stop": 25,
      "attack": 30,
      "dead": 80,
      "null": 251
    },
    "count": 265,
    "frames": {
      "1": {
        "shadow": true
      },
      "30": {
        "alert": true
      },
      "118": {
        "stop": true
      },
      "23": {
        "jump": 3
      },
      "46": {
        "damage": true
      },
      "68": {
        "jump": 30
      }
    }
  },
  "ghost": {
    "labels": {
      "init": 1,
      "alive": 3,
      "stop": 25,
      "attack": 30,
      "dead": 80,
      "null": 251
    },
    "count": 265,
    "frames": {
      "1": {
        "shadow": true
      },
      "30": {
        "alert": true
      },
      "118": {
        "stop": true
      },
      "23": {
        "stop": true
      },
      "46": {
        "damage": true
      },
      "68": {
        "jump": 30
      }
    }
  },
  "ogre": {
    "labels": {
      "init": 1,
      "alive": 6,
      "attack": 29,
      "dead": 76,
      "null": 235
    },
    "count": 249,
    "frames": {
      "1": {
        "shadow": true
      },
      "64": {
        "jump": 29
      },
      "102": {
        "stop": true
      },
      "56": {
        "damage": true
      },
      "26": {
        "jump": 6
      },
      "29": {
        "alert": true
      }
    }
  },
  "knight": {
    "labels": {
      "init": 1,
      "alive": 3,
      "attack": 33,
      "dead": 83,
      "null": 254
    },
    "count": 268,
    "frames": {
      "121": {
        "stop": true
      },
      "1": {
        "shadow": true
      },
      "30": {
        "jump": 3
      },
      "33": {
        "alert": true
      },
      "71": {
        "jump": 33
      },
      "52": {
        "damage": true
      }
    }
  },
  "bird": {
    "labels": {
      "init": 1,
      "alive": 3,
      "dead": 30,
      "null": 144
    },
    "count": 161,
    "frames": {
      "1": {
        "shadow": false
      },
      "23": {
        "jump": 3
      },
      "41": {
        "shadow": true
      },
      "59": {
        "stop": true
      }
    }
  },
  "tank": {
    "labels": {
      "init": 1,
      "alive": 3,
      "attack": 20,
      "attack2": 74,
      "dead": 174,
      "null": 290
    },
    "count": 307,
    "frames": {
      "1": {
        "shadow": true
      },
      "205": {
        "stop": true
      },
      "20": {
        "alert": true
      },
      "102": {
        "damage": true,
        "alert": true
      },
      "162": {
        "jump": 74
      },
      "17": {
        "jump": 3
      }
    }
  },
  "dino": {
    "labels": {
      "init": 1,
      "alive": 3,
      "attack": 26,
      "dead": 194,
      "null": 358
    },
    "count": 375,
    "frames": {
      "1": {
        "shadow": true
      },
      "225": {
        "stop": true
      },
      "146": {
        "damage": true
      },
      "23": {
        "jump": 3
      },
      "26": {
        "alert": true
      },
      "179": {
        "attacked": true
      },
      "182": {
        "jump": 26,
        "attacked": true
      }
    }
  },
  "dragon": {
    "labels": {
      "init": 1,
      "alive": 3,
      "stand": 25,
      "attack": 43,
      "dead": 107,
      "null": 225
    },
    "count": 225,
    "frames": {
      "1": {
        "shadow": false
      },
      "117": {
        "shadow": true
      },
      "100": {
        "jump": 43
      },
      "66": {
        "damage": true
      },
      "43": {
        "alert": true
      },
      "40": {
        "jump": 25
      },
      "78": {
        "attacked": true
      },
      "140": {
        "stop": true
      },
      "21": {
        "jump": 3
      }
    }
  }
};
