FROM ros:noetic-ros-core

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    python3-pip \
    python3-rospy \
    ros-noetic-geometry-msgs \
    ros-noetic-sensor-msgs \
    ros-noetic-std-msgs \
    ros-noetic-tf \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install numpy requests

COPY . /app

RUN chmod +x /app/simulator.py

CMD ["python3", "/app/simulator.py"]
