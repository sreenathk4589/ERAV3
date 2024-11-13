from pydantic import BaseModel
from typing import List, Optional

class LayerConfig(BaseModel):
    layer_type: str  # "conv2d", "maxpool", "activation", or "linear"
    # Conv2D parameters
    in_channels: Optional[int] = None
    out_channels: Optional[int] = None
    kernel_size: Optional[int] = None
    stride: Optional[int] = None
    padding: Optional[int] = None
    # MaxPool parameters
    # kernel_size and stride are shared with Conv2D
    # Linear parameters
    in_features: Optional[int] = None
    out_features: Optional[int] = None
    # Activation parameters
    function: Optional[str] = None

class ModelConfig(BaseModel):
    layers: List[LayerConfig]
    optimizer_type: str
    loss_function: str
    learning_rate: float
    batch_size: int
    num_epochs: int
    device: str
    augmentations: List[str] 